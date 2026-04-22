"""
Google OAuth Service
Verifies Google ID tokens and returns the decoded claims.
"""

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request

logger = logging.getLogger(__name__)

# Set in Railway env vars: GOOGLE_CLIENT_ID
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')


class GoogleOAuthService:
    """Service for verifying Google ID tokens."""

    @staticmethod
    def verify_id_token(credential: str) -> dict | None:
        """
        Verify a Google ID token using Google's tokeninfo endpoint.

        Args:
            credential: The raw Google ID token string from the frontend.

        Returns:
            The decoded token claims (email, name, sub, etc.) if valid,
            or None if verification fails.
        """
        if not credential:
            return None

        # -------------------------------------------------------------------
        # Call Google's public tokeninfo endpoint.
        # The credential is URL-encoded to prevent URL injection.
        # -------------------------------------------------------------------
        try:
            url = 'https://oauth2.googleapis.com/tokeninfo?' + \
                  urllib.parse.urlencode({'id_token': credential})
            req = urllib.request.Request(url, headers={'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=10) as response:
                idinfo = json.loads(response.read().decode())
        except urllib.error.HTTPError as err:
            logger.warning("Google token verification failed: HTTP %s", err.code)
            return None
        except Exception as e:
            logger.error("Google token verification error: %s", str(e), exc_info=True)
            return None

        # -------------------------------------------------------------------
        # Validate audience when GOOGLE_CLIENT_ID is configured.
        # This prevents tokens issued for other apps from being accepted.
        # -------------------------------------------------------------------
        if GOOGLE_CLIENT_ID and idinfo.get('aud') != GOOGLE_CLIENT_ID:
            logger.warning("Google token audience mismatch — token not issued for this app")
            return None

        # -------------------------------------------------------------------
        # Require a verified email from Google.
        # The tokeninfo endpoint may return email_verified as bool or string.
        # -------------------------------------------------------------------
        email_verified = idinfo.get('email_verified', False)
        if not (email_verified is True or str(email_verified).lower() == 'true'):
            logger.warning("Google account email is not verified")
            return None

        email = idinfo.get('email', '').strip()
        if not email:
            logger.warning("Google token contains no email claim")
            return None

        return idinfo
