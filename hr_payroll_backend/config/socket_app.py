import socketio
from urllib.parse import parse_qs
connected_users = {} # { user_id: {sid1, sid2} }

# Create a Socket.IO server
sio = socketio.Server(async_mode='threading', cors_allowed_origins='*')

@sio.event
def connect(sid, environ):
    query = parse_qs(environ.get('QUERY_STRING', ''))
    user_id = query.get('userId', [None])[0]
    if user_id:
        try:
            uid = int(user_id)
            sio.save_session(sid, {'user_id': uid})
            
            if uid not in connected_users:
                connected_users[uid] = set()
                # User came online
                sio.emit('user_status_change', {'userId': uid, 'online': True})
                
            connected_users[uid].add(sid)
        except ValueError:
            pass

@sio.event
def join_room(sid, data):
    room = data.get('room')
    if room:
        sio.enter_room(sid, room)

@sio.event
def get_online_users(sid):
    return list(connected_users.keys())

@sio.event
def send_message(sid, data):
    try:
        # Import internally to avoid AppRegistryNotReady if loaded too early
        from apps.chat.models import Conversation, Message
        from apps.chat.serializers import MessageSerializer
        from django.contrib.auth import get_user_model
        from django.conf import settings
        User = get_user_model()
        
        session = sio.get_session(sid)
        sender_id = session.get('user_id')
        
        if not sender_id:
            return

        receiver_id = data.get('receiverId')
        content = data.get('content', '')
        msg_type = data.get('type', 'text')
        reply_to_id = data.get('replyTo')
        
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=receiver_id)
        
        # Find/Create Conversation
        my_convos = Conversation.objects.filter(participants=sender)
        conversation = my_convos.filter(participants=receiver).first()
        
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(sender, receiver)
            
        # Create Message
        message = Message(
            conversation=conversation,
            sender=sender,
            content=content,
            message_type=msg_type,
            is_read=False
        )
        if reply_to_id:
            try:
                rt = Message.objects.get(id=reply_to_id, conversation=conversation)
                message.reply_to = rt
            except Message.DoesNotExist:
                pass
        message.save()
        
        # Manually fix attachment URL if needed
        payload = MessageSerializer(message).data
        if payload.get('attachment') and payload['attachment'].startswith('/'):
               # We can't easily get request.build_absolute_uri here
               # But we can try to prepend a known MEDIA_URL or leave it for frontend
               pass

        # Emit to both
        print(f"[socket] send_message: sender={sender_id} receiver={receiver_id} msg_type={msg_type} id={payload.get('id')} attachment={payload.get('attachment')} attachment_url={payload.get('attachment_url')}")
        sio.emit('receive_message', payload, room=f"user_{receiver_id}")
        sio.emit('receive_message', payload, room=f"user_{sender_id}")
        
    except Exception as e:
        print(f"Socket Error: {e}")

@sio.event
def typing(sid, data):
    try:
        session = sio.get_session(sid)
        sender_id = session.get('user_id')
        receiver_id = data.get('receiverId')
        
        if sender_id and receiver_id:
            print(f"[socket] typing: from={sender_id} to={receiver_id} isTyping={data.get('isTyping')} convo={data.get('conversationId')}")
            sio.emit('display_typing', {
                'senderId': sender_id,
                'isTyping': data.get('isTyping', False)
            }, room=f"user_{receiver_id}")
    except:
        pass

@sio.event
def disconnect(sid):
    session = sio.get_session(sid)
    if not session: return
    uid = session.get('user_id')
    
    if uid and uid in connected_users:
        if sid in connected_users[uid]:
            connected_users[uid].remove(sid)
            
        if len(connected_users[uid]) == 0:
            del connected_users[uid]
            # User went offline
            sio.emit('user_status_change', {'userId': uid, 'online': False})

