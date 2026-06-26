import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const AppHeader = ({
  title,
  subtitle,
  navigation,
  showBack = true,
  onBack,
  leftIcon = 'arrow-back',
  rightActions = [],
  variant = 'surface',
  safeArea = true,
  leading = null,
}) => {
  const isPrimary = variant === 'primary';
  const iconColor = isPrimary ? COLORS.surface : COLORS.text;
  const titleColor = isPrimary ? COLORS.surface : COLORS.text;
  const subtitleColor = isPrimary ? 'rgba(255,255,255,0.82)' : COLORS.textMuted;

  const content = (
    <View style={[styles.container, isPrimary && styles.containerPrimary]}>
      {showBack ? (
        <TouchableOpacity
          style={[styles.iconButton, isPrimary && styles.iconButtonPrimary]}
          onPress={onBack || (() => navigation?.goBack?.())}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name={leftIcon} size={21} color={iconColor} />
        </TouchableOpacity>
      ) : null}

      {leading ? <View style={styles.leading}>{leading}</View> : null}

      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {rightActions.map((action, index) => (
          <TouchableOpacity
            key={action.key || `${action.icon}-${index}`}
            style={[
              styles.iconButton,
              isPrimary && styles.iconButtonPrimary,
              action.backgroundColor && { backgroundColor: action.backgroundColor },
              action.disabled && styles.iconButtonDisabled,
            ]}
            onPress={action.onPress}
            disabled={action.disabled}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
          >
            <Ionicons
              name={action.icon}
              size={action.size || 21}
              color={action.color || iconColor}
            />
            {action.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{action.badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!safeArea) {
    return content;
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, isPrimary && styles.safeAreaPrimary]}
    >
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.surface,
  },
  safeAreaPrimary: {
    backgroundColor: COLORS.primary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  containerPrimary: {
    backgroundColor: COLORS.primary,
    borderBottomWidth: 0,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  iconButtonPrimary: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  leading: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.surface,
  },
});

export default AppHeader;
