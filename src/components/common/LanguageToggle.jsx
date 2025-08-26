import React, { useState } from 'react';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function LanguageToggle({ user }) {
  const [loading, setLoading] = useState(false);
  
  const currentLanguage = user?.language || 'he';

  const handleLanguageChange = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      const newLanguage = currentLanguage === 'he' ? 'en' : 'he';
      
      // Create loading overlay
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'language-change-overlay';
      loadingOverlay.style.position = 'fixed';
      loadingOverlay.style.top = '0';
      loadingOverlay.style.left = '0';
      loadingOverlay.style.width = '100%';
      loadingOverlay.style.height = '100%';
      loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.justifyContent = 'center';
      loadingOverlay.style.alignItems = 'center';
      loadingOverlay.style.zIndex = '9999';
      
      const spinnerContainer = document.createElement('div');
      spinnerContainer.style.textAlign = 'center';
      
      const spinner = document.createElement('div');
      spinner.style.width = '50px';
      spinner.style.height = '50px';
      spinner.style.margin = '0 auto 20px auto';
      spinner.style.borderRadius = '50%';
      spinner.style.border = '5px solid rgba(0, 0, 0, 0.1)';
      spinner.style.borderTopColor = '#3B82F6';
      spinner.style.animation = 'langChangeSpin 1s linear infinite';
      
      const loadingText = document.createElement('div');
      loadingText.innerText = newLanguage === 'en' ? 'Changing to English...' : 'מחליף לעברית...';
      loadingText.style.fontFamily = 'Arial, sans-serif';
      loadingText.style.fontSize = '16px';
      loadingText.style.color = '#333';
      
      // Add animation style
      const styleEl = document.createElement('style');
      styleEl.innerHTML = '@keyframes langChangeSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(styleEl);
      
      spinnerContainer.appendChild(spinner);
      spinnerContainer.appendChild(loadingText);
      loadingOverlay.appendChild(spinnerContainer);
      document.body.appendChild(loadingOverlay);
      
      // Update user data with new language
      await User.updateMyUserData({ language: newLanguage });
      
      // Set direction before reload
      document.documentElement.dir = newLanguage === 'en' ? 'ltr' : 'rtl';
      
      // Small delay to ensure overlay is visible
      setTimeout(() => {
        window.location.reload();
      }, 800);
      
    } catch (err) {
      console.error("Error changing language:", err);
      setLoading(false);
      
      // Remove overlay on error
      const loadingOverlay = document.getElementById('language-change-overlay');
      if (loadingOverlay) {
        document.body.removeChild(loadingOverlay);
      }
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleLanguageChange}
      disabled={loading}
      className="flex items-center gap-1"
    >
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline">
        {currentLanguage === 'he' ? 'English' : 'עברית'}
      </span>
    </Button>
  );
}