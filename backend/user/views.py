from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, TemplateView
from .forms import CustomUserCreationForm

# Create your views here.
class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'

class DashboardView(TemplateView):
    template_name = 'registration/dashboard.html'

def home_view(request):
    """Redirect to dashboard if logged in, otherwise to login"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    else:
        return redirect('account_login')
