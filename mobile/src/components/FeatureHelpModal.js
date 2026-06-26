import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const FeatureHelpModal = ({ visible, onClose, title, imageSource, helpContent, t }) => {
  if (!imageSource) {
    return null;
  }

  const assetSource = Image.resolveAssetSource(imageSource);
  const imageAspectRatio = assetSource?.width && assetSource?.height
    ? assetSource.width / assetSource.height
    : 16 / 9;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.eyebrow}>
                {t('common.help', { defaultValue: 'Help' })}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {helpContent?.headline ? (
                <Text style={styles.headline}>
                  {helpContent.headline}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.imageScroll}
            contentContainerStyle={styles.imageScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <Image source={imageSource} style={[styles.image, { aspectRatio: imageAspectRatio }]} resizeMode="contain" />
            </View>

            {Array.isArray(helpContent?.steps) ? (
              <View style={styles.section}>
                {helpContent.steps.map((step) => (
                  <View key={`${step.number}-${step.title}`} style={styles.stepCard}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{step.number}</Text>
                    </View>
                    <View style={styles.stepIcon}>
                      <Ionicons name={step.icon} size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.stepTextWrap}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepBody}>{step.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {Array.isArray(helpContent?.highlights) ? (
              <View style={styles.section}>
                {helpContent.highlights.map((highlight) => (
                  <View key={highlight.title} style={styles.highlightCard}>
                    <View style={styles.highlightIcon}>
                      <Ionicons name={highlight.icon} size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.stepTextWrap}>
                      <Text style={styles.highlightTitle}>{highlight.title}</Text>
                      <Text style={styles.stepBody}>{highlight.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {helpContent?.footer ? (
              <View style={styles.footerBanner}>
                <Text style={styles.footerText}>{helpContent.footer}</Text>
              </View>
            ) : null}
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.88}>
            <Text style={styles.doneButtonText}>
              {t('common.close', { defaultValue: 'Close' })}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 21, 0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    height: '92%',
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  headline: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  imageScroll: {
    flex: 1,
  },
  imageScrollContent: {
    padding: 12,
    paddingBottom: 20,
  },
  heroCard: {
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: '100%',
    height: undefined,
    backgroundColor: COLORS.surfaceAlt,
  },
  section: {
    marginTop: 14,
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  stepNumberText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '900',
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  stepBody: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F7FBF7',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    gap: 10,
  },
  highlightIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  highlightTitle: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '900',
  },
  footerBanner: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
  },
  footerText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  doneButton: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  doneButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '800',
  },
});

export default FeatureHelpModal;
