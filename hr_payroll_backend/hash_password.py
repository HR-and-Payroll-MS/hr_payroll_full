# import os to work with environment variables
import os

# import django to initialize the project
import django

# set the default settings module (IMPORTANT)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings") # change this if your settings path is different

# setup Django
django.setup()

# now import the password hasher
from django.contrib.auth.hashers import make_password

# define your raw password
raw_password = "seudsahm1232"

# hash the password
hashed_password = make_password(raw_password)

# print result
print(hashed_password)