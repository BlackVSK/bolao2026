from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'is_admin', 'is_staff', 'is_superuser', 'date_joined']
    list_filter = ['is_admin', 'is_staff', 'is_superuser']
    fieldsets = UserAdmin.fieldsets + (
        ('Bolão', {'fields': ('is_admin',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Bolão', {'fields': ('is_admin',)}),
    )
