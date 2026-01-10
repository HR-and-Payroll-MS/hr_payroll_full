def get_policy(section, organization_id=0):
    """
    Retrieves the content of a specific policy section.
    Tries Org 1 (Frontend Default) then Org 0 (System Default).
    Uses apps.get_model to avoid circular imports.
    """
    try:
        from django.apps import apps
        Policy = apps.get_model('policies', 'Policy')
        
        # Try requested org
        policy = Policy.objects.filter(organization_id=organization_id, section=section, is_active=True).first()
        if policy and policy.content:
            return policy.content
            
        # Fallback to Org 1 if Org 0 was requested but empty
        if organization_id == 0:
            policy = Policy.objects.filter(organization_id=1, section=section, is_active=True).first()
            if policy and policy.content:
                return policy.content
                
        return {}
    except Exception as e:
        print(f"Error in get_policy: {e}")
        return {}
