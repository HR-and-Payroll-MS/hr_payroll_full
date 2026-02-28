from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Policy
from .serializers import PolicySerializer

from apps.core.permissions import IsHRManager
import logging

logger = logging.getLogger('policies')

class PolicyListView(APIView):
    """GET /orgs/{org_id}/policies/"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, org_id):
        try:
            target_org_id = int(org_id)
            policies = Policy.objects.filter(organization_id=target_org_id, is_active=True)
            serializer = PolicySerializer(policies, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.exception('PolicyListView GET failed')
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PolicyDetailView(APIView):
    """GET/PUT /orgs/{org_id}/policies/{section}"""
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsHRManager()]
    
    def get(self, request, org_id, section):
        try:
            target_org_id = int(org_id)
            policy = Policy.objects.get(organization_id=target_org_id, section=section)
            return Response(PolicySerializer(policy).data)
        except Policy.DoesNotExist:
            return Response({'error': 'Policy not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception('PolicyDetailView GET failed for org=%s section=%s', org_id, section)
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, org_id, section):
        try:
            target_org_id = int(org_id)
            # Validate incoming content
            from apps.policies.utils import validate_policy_content
            content = request.data.get('content', {})
            if not validate_policy_content(section, content):
                return Response({'error': 'Invalid policy content for section'}, status=status.HTTP_400_BAD_REQUEST)
            policy, created = Policy.objects.get_or_create(
                organization_id=target_org_id,
                section=section,
                defaults={'content': request.data.get('content', {})}
            )
            if not created:
                policy.content = request.data.get('content', policy.content)
                policy.version += 1
                policy.save()
            return Response(PolicySerializer(policy).data)
        except Exception as e:
            logger.exception('PolicyDetailView PUT failed for org=%s section=%s', org_id, section)
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
