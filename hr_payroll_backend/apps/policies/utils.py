def get_policy(section, organization_id=1):
    """
    Retrieves the content of a specific policy section for a single-organization setup.
    Defaults to `organization_id=1` (the single org). Returns a plain dict.
    Uses apps.get_model to avoid circular imports.
    """
    try:
        from django.apps import apps
        import logging
        logger = logging.getLogger('policies')

        Policy = apps.get_model('policies', 'Policy')

        # Try requested org first (default: 1)
        policy = Policy.objects.filter(organization_id=organization_id, section=section, is_active=True).first()
        if policy and isinstance(policy.content, dict):
            return policy.content

        # Fallback: try org 0 (system defaults) if present
        policy = Policy.objects.filter(organization_id=0, section=section, is_active=True).first()
        if policy and isinstance(policy.content, dict):
            return policy.content

        return {}
    except Exception as e:
        # Use logger instead of print
        try:
            logger.exception('Error in get_policy for %s', section)
        except Exception:
            pass
        return {}


def validate_policy_content(section: str, content: dict) -> bool:
    """
    Basic sanity checks for policy content. Returns True if content is a dict.
    This is intentionally lightweight; section-specific validation can be
    extended as needed.
    """
    if not isinstance(content, dict):
        return False

    def is_time_str(s):
        if not isinstance(s, str):
            return False
        parts = s.split(':')
        if len(parts) != 2:
            return False
        try:
            h = int(parts[0]); m = int(parts[1])
            return 0 <= h <= 23 and 0 <= m <= 59
        except Exception:
            return False

    if section == 'attendancePolicy':
        # shiftTimes: optional list of { title?, start, end }
        st = content.get('shiftTimes')
        if st is not None:
            if not isinstance(st, list) or len(st) == 0:
                return False
            for item in st:
                if not isinstance(item, dict):
                    return False
                if 'start' not in item or 'end' not in item:
                    return False
                if not is_time_str(item.get('start')) or not is_time_str(item.get('end')):
                    return False

        gp = content.get('gracePeriod')
        if gp is not None:
            if not isinstance(gp, dict):
                return False
            late = gp.get('lateAfter', gp.get('minutesAllowed'))
            if late is not None:
                try:
                    int(late)
                except Exception:
                    return False

        ar = content.get('absentRules')
        if ar is not None:
            if not isinstance(ar, dict):
                return False
            a = ar.get('absentAfterMinutes')
            if a is not None:
                try:
                    int(a)
                except Exception:
                    return False

        return True

    # Future: add stricter schemas for 'overtimePolicy', 'leavePolicy', etc.
    return True
