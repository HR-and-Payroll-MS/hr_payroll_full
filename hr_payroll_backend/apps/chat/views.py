"""
Views for Chat App.
"""
from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, ChatUserSerializer
from config.socket_app import sio
from apps.employees.models import Employee

User = get_user_model()

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        # Mark messages as read
        conversation.messages.exclude(sender=request.user).update(is_read=True)
        # Emit read-receipts to other participant and optionally to reader to clear badges
        try:
            other_ids = list(conversation.participants.exclude(id=request.user.id).values_list('id', flat=True))
            if other_ids:
                other_id = other_ids[0]
                # Notify the other participant that their messages were read
                sio.emit('messages_read', {
                    'conversationId': conversation.id,
                    'readerId': request.user.id,
                }, room=f"user_{other_id}")
            # Notify reader client to clear unread for this conversation
            sio.emit('messages_read', {
                'conversationId': conversation.id,
                'readerId': request.user.id,
            }, room=f"user_{request.user.id}")
        except Exception as e:
            print(f"[socket] emit messages_read error: {e}")
        
        # Determine strict limit or pagination later
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def initiate(self, request):
        """
        Get or Create a conversation with a specific user.
        Payload: { userId: <id> }
        """
        target_user_id = request.data.get('userId')
        if not target_user_id:
            return Response({'error': 'userId required'}, status=400)
            
        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
            
        # Check if conversation exists (for 1-on-1)
        # We need a conversation that has exactly these 2 participants
        # Simplistic approach: intersection
        
        # conversations where current user is participant
        my_convos = Conversation.objects.filter(participants=request.user)
        # filter those where target user is also participant
        conversation = my_convos.filter(participants=target_user).first()
        
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, target_user)
            
        return Response(ConversationSerializer(conversation, context={'request': request}).data)

class ChatUserListView(APIView):
    """
    List all potential chat users (Employees).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return all active users except self
        users = User.objects.filter(is_active=True).exclude(id=request.user.id)
        serializer = ChatUserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=400)
            
        # We create a dummy message just to save the file? 
        # Or returns URL to be sent via socket.
        # Better: Create a temporary storage or just use FileSystemStorage directly and return URL.
        # However, to use Django's storage properly, usually we need a model instance.
        # Let's use a Message instance that is not yet associated or just save it.
        
        # Strategy: Save to a Message object that is "draft" or just create it immediately?
        # Actually, socket usually sends the message. The file likely needs to be uploaded first.
        # Let's save it to a model but maybe not linked to conversation yet?
        # Or the frontend sends the message via API (Multipart) and we emit socket event from view.
        
        # Let's allow sending message via API for files.
        conversation_id = request.data.get('conversationId')
        if not conversation_id:
            return Response({'error': 'conversationId required'}, status=400)
            
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        except Conversation.DoesNotExist:
             return Response({'error': 'Conversation not found'}, status=404)
             
        msg_type = request.data.get('type', 'file')
        reply_to_id = request.data.get('replyTo')
        
        message = Message(
            conversation=conversation,
            sender=request.user,
            attachment=file_obj,
            message_type=msg_type,
            content=request.data.get('content', '')
        )
        if reply_to_id:
            try:
                rt = Message.objects.get(id=reply_to_id, conversation=conversation)
                message.reply_to = rt
            except Message.DoesNotExist:
                pass
        message.save()
        
        payload = MessageSerializer(message).data
        # Find the other participant to notify
        other_ids = list(conversation.participants.exclude(id=request.user.id).values_list('id', flat=True))
        if other_ids:
            receiver_id = other_ids[0]
            try:
                # Emit to both rooms, mirroring socket send_message behavior
                sio.emit('receive_message', payload, room=f"user_{receiver_id}")
                sio.emit('receive_message', payload, room=f"user_{request.user.id}")
            except Exception as e:
                print(f"Socket emit error (upload): {e}")
        
        return Response(payload)
