import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { registerForPushNotifications } from '../services/notificationService';

/**
 * TOKEN TESTER COMPONENT
 * Add this to any screen to get and copy your push token
 */

const TokenTester = () => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const getToken = async () => {
    setLoading(true);
    try {
      const registration = await registerForPushNotifications();
      setToken(registration?.token || null);
      
      // Show in alert
      Alert.alert(
        'Your Push Token',
        pushToken,
        [
          { text: 'Copy', onPress: () => {
            Clipboard.setString(pushToken);
            Alert.alert('Copied!', 'Token copied to clipboard');
          }},
          { text: 'OK' }
        ]
      );
      
      console.log('='.repeat(50));
      console.log('YOUR EXPO PUSH TOKEN:');
      console.log(pushToken);
      console.log('='.repeat(50));
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={getToken}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Getting Token...' : 'Get My Push Token'}
        </Text>
      </TouchableOpacity>
      
      {token && (
        <View style={styles.tokenContainer}>
          <Text style={styles.label}>Your Token:</Text>
          <Text style={styles.token} selectable={true}>
            {token}
          </Text>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => {
              Clipboard.setString(token);
              Alert.alert('Copied!', 'Token copied to clipboard');
            }}
          >
            <Text style={styles.copyButtonText}>Copy Token</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    backgroundColor: '#15BB73',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  token: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginBottom: 10,
  },
  copyButton: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TokenTester;
