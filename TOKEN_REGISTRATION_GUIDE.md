# ========================================
# TOKEN REGISTRATION - STEP BY STEP GUIDE
# ========================================

## STEP 1: Add Imports at the Top

Find this line (around line 1-10):
\\\javascript
import React, { useState, useRef, useEffect } from 'react';
\\\

Add these imports after it:
\\\javascript
import { Platform } from 'react-native';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { API_URL } from '../services/api';
\\\

---

## STEP 2: Add Token Registration Function

After the imports, before the component, add this function:
\\\javascript
// Register push notification token with backend
const registerPushToken = async (userId) => {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    
    if (pushToken) {
      console.log('Push token obtained:', pushToken);
      
      // Send token to backend
      const response = await fetch(\\/notifications/register-token\, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          token: pushToken,
          platform: Platform.OS,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Push token registered successfully');
      } else {
        console.log('Failed to register push token:', data.message);
      }
    }
  } catch (error) {
    console.log('Error registering push token:', error);
    // Don't block login if token registration fails
  }
};
\\\

---

## STEP 3: Call Function After Login

Find this code (around line 73-79):
\\\javascript
if (response.success) {
  await login(response.token, response.user);
  
  if (!response.user.isProfileComplete) {
    navigation.replace('ProfileCompletion');
  } else {
    navigation.replace('MainTabs');
  }
}
\\\

Replace it with:
\\\javascript
if (response.success) {
  await login(response.token, response.user);
  
  // Register push notification token
  await registerPushToken(response.user.id);
  
  if (!response.user.isProfileComplete) {
    navigation.replace('ProfileCompletion');
  } else {
    navigation.replace('MainTabs');
  }
}
\\\

---

That's it! Token will be registered after every successful login.

