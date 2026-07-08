import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS } from '../utils/constants';

const SkeletonBlock = ({ width = '100%', height = 16, radius = 10, style }) => (
  <View style={[styles.block, { width, height, borderRadius: radius }, style]} />
);

const SkeletonPulse = ({ children, style }) => {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 720,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

const AnimalCardSkeleton = ({ compact = false }) => (
  <View style={[styles.card, compact && styles.cardCompact]}>
    <SkeletonBlock height={compact ? 130 : 180} radius={20} />
    <View style={styles.cardBody}>
      <View style={styles.rowBetween}>
        <SkeletonBlock width="28%" height={22} radius={12} />
        <SkeletonBlock width="34%" height={24} radius={12} />
      </View>
      <SkeletonBlock width="62%" height={22} radius={12} style={styles.mt14} />
      <SkeletonBlock width="42%" height={18} radius={10} style={styles.mt10} />
      <SkeletonBlock width="76%" height={16} radius={10} style={styles.mt12} />
    </View>
  </View>
);

const VetCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.row}>
      <SkeletonBlock width={64} height={64} radius={32} />
      <View style={styles.flex}>
        <SkeletonBlock width="62%" height={22} radius={12} />
        <SkeletonBlock width="46%" height={16} radius={10} style={styles.mt10} />
        <SkeletonBlock width="72%" height={16} radius={10} style={styles.mt10} />
      </View>
    </View>
    <View style={[styles.rowBetween, styles.mt16]}>
      <SkeletonBlock width="46%" height={42} radius={14} />
      <SkeletonBlock width="46%" height={42} radius={14} />
    </View>
  </View>
);

const ListRowSkeleton = () => (
  <View style={styles.listRow}>
    <SkeletonBlock width={52} height={52} radius={26} />
    <View style={styles.flex}>
      <SkeletonBlock width="72%" height={18} radius={10} />
      <SkeletonBlock width="52%" height={14} radius={8} style={styles.mt10} />
      <SkeletonBlock width="86%" height={12} radius={8} style={styles.mt10} />
    </View>
  </View>
);

const SchemeCardSkeleton = () => (
  <View style={styles.schemeCard}>
    <SkeletonBlock height={84} radius={18} />
    <View style={styles.cardBody}>
      <SkeletonBlock width="34%" height={14} radius={8} />
      <SkeletonBlock width="86%" height={22} radius={12} style={styles.mt12} />
      <SkeletonBlock width="68%" height={16} radius={10} style={styles.mt10} />
      <View style={[styles.rowBetween, styles.mt16]}>
        <SkeletonBlock width="32%" height={24} radius={12} />
        <SkeletonBlock width="32%" height={24} radius={12} />
      </View>
    </View>
  </View>
);

const DashboardSkeleton = () => (
  <View>
    <View style={styles.heroSkeleton}>
      <SkeletonBlock width="55%" height={18} radius={10} />
      <SkeletonBlock width="82%" height={34} radius={16} style={styles.mt16} />
      <SkeletonBlock width="60%" height={16} radius={10} style={styles.mt14} />
    </View>
    <View style={styles.statsRow}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.statCard}>
          <SkeletonBlock width="52%" height={26} radius={12} />
          <SkeletonBlock width="72%" height={12} radius={8} style={styles.mt10} />
        </View>
      ))}
    </View>
    <View style={styles.card}>
      <SkeletonBlock width="44%" height={20} radius={12} />
      <SkeletonBlock height={150} radius={18} style={styles.mt16} />
      <SkeletonBlock width="72%" height={16} radius={10} style={styles.mt16} />
      <SkeletonBlock width="58%" height={16} radius={10} style={styles.mt10} />
    </View>
  </View>
);

const DetailSkeleton = () => (
  <View>
    <SkeletonBlock height={310} radius={0} />
    <View style={styles.detailContent}>
      <View style={styles.rowBetween}>
        <SkeletonBlock width="32%" height={26} radius={14} />
        <SkeletonBlock width="34%" height={28} radius={14} />
      </View>
      <SkeletonBlock width="70%" height={34} radius={16} style={styles.mt18} />
      <SkeletonBlock width="54%" height={18} radius={10} style={styles.mt12} />
      <View style={styles.detailGrid}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={styles.detailTile}>
            <SkeletonBlock width="48%" height={20} radius={10} />
            <SkeletonBlock width="72%" height={12} radius={8} style={styles.mt10} />
          </View>
        ))}
      </View>
      <SkeletonBlock height={120} radius={18} style={styles.mt18} />
    </View>
  </View>
);

const MapSkeleton = () => (
  <View>
    <View style={styles.mapHero}>
      <SkeletonBlock width={86} height={86} radius={43} />
      <SkeletonBlock width="62%" height={28} radius={14} style={styles.mt16} />
      <SkeletonBlock width="48%" height={16} radius={10} style={styles.mt12} />
    </View>
    <View style={styles.card}>
      <SkeletonBlock width="55%" height={18} radius={10} />
      <SkeletonBlock width="80%" height={28} radius={14} style={styles.mt14} />
      <SkeletonBlock height={190} radius={18} style={styles.mt18} />
    </View>
  </View>
);

const SkeletonLoader = ({
  variant = 'list',
  count = 3,
  compact = false,
  style,
}) => {
  const items = Array.from({ length: count });

  const content = (() => {
    switch (variant) {
      case 'detail':
        return <DetailSkeleton />;
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'vetList':
        return items.map((_, index) => <VetCardSkeleton key={index} />);
      case 'schemeList':
        return items.map((_, index) => <SchemeCardSkeleton key={index} />);
      case 'map':
        return <MapSkeleton />;
      case 'profileList':
      case 'animalList':
        return items.map((_, index) => (
          <AnimalCardSkeleton key={index} compact={compact} />
        ));
      case 'list':
      default:
        return items.map((_, index) => <ListRowSkeleton key={index} />);
    }
  })();

  return (
    <SkeletonPulse style={[styles.wrapper, style]}>
      {content}
    </SkeletonPulse>
  );
};

export default SkeletonLoader;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  block: {
    backgroundColor: '#E7E5DD',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardCompact: {
    padding: 12,
  },
  cardBody: {
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mt10: {
    marginTop: 10,
  },
  mt12: {
    marginTop: 12,
  },
  mt14: {
    marginTop: 14,
  },
  mt16: {
    marginTop: 16,
  },
  mt18: {
    marginTop: 18,
  },
  heroSkeleton: {
    minHeight: 180,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailContent: {
    padding: 18,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  detailTile: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  schemeCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapHero: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2EF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
});
