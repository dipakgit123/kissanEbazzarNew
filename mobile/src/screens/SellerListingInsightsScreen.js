import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBuffaloBreedOptions } from '../constants/buffaloBreeds';
import { getCatBreedOptions } from '../constants/catBreeds';
import { getCowBreedOptions } from '../constants/cowBreeds';
import { getDogBreedOptions } from '../constants/dogBreeds';
import { getGoatBreedOptions } from '../constants/goatBreeds';
import { getHorseBreedOptions } from '../constants/horseBreeds';
import { listingsService } from '../services/api';
import { COLORS } from '../utils/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRAPH_HEIGHT = 148;
const POINT_GAP = 58;
const GRAPH_TOP = 34;

const formatCurrency = (value) => `\u20B9${Number(value || 0).toLocaleString('en-IN')}`;

const getImageUri = (listing) => listing?.photo1 || listing?.photos?.[0] || null;

const getBreedOptionsByType = (animalType, language, selectLabel) => {
  const normalizedType = String(animalType || '').toLowerCase();
  const optionLoaders = {
    cow: getCowBreedOptions,
    buffalo: getBuffaloBreedOptions,
    goat: getGoatBreedOptions,
    horse: getHorseBreedOptions,
    dog: getDogBreedOptions,
    cat: getCatBreedOptions,
  };

  return optionLoaders[normalizedType]?.(language, selectLabel) || [];
};

const getLocalizedBreedName = (listing, language, t) => {
  const breed = listing?.breed || listing?.breed_name;
  if (!breed) {
    return t('profile.animalListing', { defaultValue: 'Animal listing' });
  }

  const options = getBreedOptionsByType(
    listing?.animal_type || listing?.type,
    language,
    t('common.select', { defaultValue: 'Select' })
  );
  const match = options.find((option) => option.value === breed);
  return match?.label || breed;
};

const getTranslatedCallStatus = (status, t) => {
  const key = String(status || '').toLowerCase();
  return t(`profile.callStatuses.${key}`, {
    defaultValue: status || t('profile.callStatuses.unknown', { defaultValue: 'Unknown' }),
  });
};

const getLanguageTag = (language) => {
  if (String(language || '').startsWith('mr')) return 'mr-IN';
  if (String(language || '').startsWith('hi')) return 'hi-IN';
  return 'en-IN';
};

const formatChartDate = (day, language) => {
  const date = new Date(day);
  if (Number.isNaN(date.getTime())) return String(day || '').slice(5).replace('-', '/');

  return date.toLocaleDateString(getLanguageTag(language), {
    day: 'numeric',
    month: 'short',
  });
};

const calculateDistanceKm = (fromLat, fromLng, toLat, toLng) => {
  const values = [fromLat, fromLng, toLat, toLng].map(Number);
  if (values.some((value) => Number.isNaN(value))) return null;

  const [lat1, lon1, lat2, lon2] = values;
  const earthRadius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildMapBuyers = (buyerLocations, listing) => {
  const positions = [
    { left: '13%', top: '37%' },
    { left: '73%', top: '32%' },
    { left: '79%', top: '53%' },
    { left: '24%', top: '22%' },
    { left: '63%', top: '61%' },
  ];

  const realBuyers = (buyerLocations || [])
    .filter((buyer) => Number.isFinite(Number(buyer.latitude)) && Number.isFinite(Number(buyer.longitude)))
    .slice(0, 5);

  return realBuyers.map((buyer, index) => {
    const position = positions[index % positions.length];
    const distance = calculateDistanceKm(listing?.latitude, listing?.longitude, buyer.latitude, buyer.longitude);

    return {
      ...buyer,
      left: position.left,
      top: position.top,
      distance: distance ? distance.toFixed(1) : null,
    };
  });
};

const LiveBuyerMap = ({ listing, summary, buyerLocations, imageUri, navigation, t }) => {
  const buyers = buildMapBuyers(buyerLocations, listing);
  const locationName = listing?.city || listing?.state || t('profile.marketplace', { defaultValue: 'Marketplace' });

  return (
    <View style={styles.liveMap}>
      <View style={styles.mapPattern}>
        {Array.from({ length: 11 }).map((_, index) => (
          <View
            key={`h-${index}`}
            style={[
              styles.mapRoadHorizontal,
              { top: 30 + index * 31, transform: [{ rotate: `${index % 2 === 0 ? -5 : 4}deg` }] },
            ]}
          />
        ))}
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`v-${index}`}
            style={[
              styles.mapRoadVertical,
              { left: 18 + index * 49, transform: [{ rotate: `${index % 2 === 0 ? 8 : -7}deg` }] },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.mapBackButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.liveTopBar}>
        <Text style={styles.liveBadge}>{t('profile.live', { defaultValue: 'Live' })}</Text>
        <Text style={styles.liveLocation} numberOfLines={1}>{String(locationName).toUpperCase()}</Text>
      </View>

      <View style={styles.liveStatsBar}>
        <View style={styles.liveStatChip}>
          <Text style={styles.liveStatNumber}>{summary?.views || 0}</Text>
          <Text style={styles.liveStatLabel}>{t('profile.viewsMetric', { defaultValue: 'Views' })}</Text>
        </View>
        <View style={styles.liveStatChip}>
          <Text style={styles.liveStatNumber}>{summary?.calls || 0}</Text>
          <Text style={styles.liveStatLabel}>{t('profile.buyersAvailable', { defaultValue: 'buyers available' })}</Text>
        </View>
      </View>

      {buyers.map((buyer, index) => (
        <View key={buyer.id || index} style={[styles.mapBuyerBubble, { left: buyer.left, top: buyer.top }]}>
          <View style={styles.buyerAvatar}>
            {buyer.buyerPhoto ? (
              <Image source={{ uri: buyer.buyerPhoto }} style={styles.buyerAvatarImage} />
            ) : (
              <Text style={styles.buyerAvatarText}>
                {(buyer.buyerName || t('profile.buyerShort', { defaultValue: 'B' })).charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.onlineDot} />
          {buyer.distance ? (
            <View style={styles.distanceChip}>
              <Text style={styles.distanceText}>{buyer.distance} {t('common.km', { defaultValue: 'km' })}</Text>
            </View>
          ) : null}
        </View>
      ))}

      {buyers.length === 0 ? (
        <View style={styles.realLocationHint}>
          <Ionicons name="location-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.realLocationHintText}>
            {t('profile.noBuyerLocationsYet', { defaultValue: 'Buyer markers appear after calls with location data' })}
          </Text>
        </View>
      ) : null}

      <View style={styles.centerPulseOuter}>
        <View style={styles.centerPulseMiddle}>
          <View style={styles.centerAnimal}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.centerAnimalImage} />
            ) : (
              <Ionicons name="paw" size={32} color={COLORS.primary} />
            )}
          </View>
        </View>
      </View>

      <View style={styles.mapHeadline}>
        <Ionicons name="radio-outline" size={20} color={COLORS.textMuted} />
        <Text style={styles.mapHeadlineMuted}>{t('profile.forYou', { defaultValue: 'For you' })}</Text>
        <Text style={styles.mapHeadlineTitle}>
          {t('profile.searchingBuyersForYou', { defaultValue: 'Buyers are searching...' })}
        </Text>
      </View>
    </View>
  );
};

const ListingStatusCard = ({ listing, summary, imageUri, isSold, onShare, t, language }) => (
  <View style={styles.listingCard}>
    <View style={[styles.visibleBanner, isSold && styles.soldBanner]}>
      <Ionicons name={isSold ? 'checkmark-circle' : 'call'} size={18} color={isSold ? COLORS.textMuted : COLORS.primaryDark} />
      <Text style={[styles.visibleBannerText, isSold && styles.soldBannerText]}>
        {isSold
          ? t('profile.animalSold', { defaultValue: 'Animal sold' })
          : t('profile.visibleToBuyersNow', { defaultValue: 'Your animal is visible to buyers' })}
      </Text>
    </View>

    <View style={styles.listingCardBody}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.listingThumb} />
      ) : (
        <View style={styles.listingThumbPlaceholder}>
          <Ionicons name="paw-outline" size={30} color={COLORS.primary} />
        </View>
      )}

      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={1}>
          {getLocalizedBreedName(listing, language, t)}
        </Text>
        <Text style={styles.listingPrice}>{formatCurrency(listing?.price || listing?.expected_price)}</Text>
        <Text style={styles.listingMeta} numberOfLines={1}>
          {[listing?.age, listing?.gender, listing?.city].filter(Boolean).join('  \u2022  ') ||
            t('profile.listingDetails', { defaultValue: 'Listing details' })}
        </Text>
      </View>

      <View style={styles.listingActions}>
        <TouchableOpacity style={styles.shareButton} onPress={onShare} activeOpacity={0.85}>
          <Ionicons name="share-social-outline" size={18} color={COLORS.accent} />
          <Text style={styles.shareText}>{t('profile.share', { defaultValue: 'Share' })}</Text>
        </TouchableOpacity>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{summary?.views || 0}</Text>
          <Text style={styles.miniStatLabel}>{t('profile.viewsMetric', { defaultValue: 'views' })}</Text>
        </View>
      </View>
    </View>
  </View>
);

const MetricChart = ({ data = [], total, metric, onMetricChange, t, language }) => {
  const safeData = data.length > 0 ? data : [{ day: new Date().toISOString().slice(0, 10), count: 0 }];
  const maxValue = Math.max(1, ...safeData.map((item) => Number(item.count || 0)));
  const chartWidth = Math.max(SCREEN_WIDTH - 64, safeData.length * POINT_GAP + 34);
  const points = safeData.map((item, index) => {
    const count = Number(item.count || 0);
    const x = 18 + index * POINT_GAP;
    const y = GRAPH_TOP + GRAPH_HEIGHT - (count / maxValue) * (GRAPH_HEIGHT - 24);
    return { ...item, count, x, y };
  });
  const activeLabel = metric === 'views'
    ? t('profile.seenByBuyers', { defaultValue: 'buyers viewed this animal' })
    : t('profile.calledByBuyers', { defaultValue: 'buyers called about this animal' });

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>
          <Text style={styles.chartTotal}>{total || 0} </Text>
          {activeLabel}
        </Text>
        <View style={styles.metricToggle}>
          <TouchableOpacity
            style={[styles.metricToggleButton, metric === 'views' && styles.metricToggleActive]}
            onPress={() => onMetricChange('views')}
            activeOpacity={0.85}
          >
            <Text style={[styles.metricToggleText, metric === 'views' && styles.metricToggleTextActive]}>
              {t('profile.viewsMetric', { defaultValue: 'Views' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.metricToggleButton, metric === 'calls' && styles.metricToggleActive]}
            onPress={() => onMetricChange('calls')}
            activeOpacity={0.85}
          >
            <Text style={[styles.metricToggleText, metric === 'calls' && styles.metricToggleTextActive]}>
              {t('profile.callsMetric', { defaultValue: 'Calls' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScrollContent}>
        <View style={[styles.chartCanvas, { width: chartWidth }]}>
          {[0, 1, 2].map((line) => (
            <View key={line} style={[styles.gridLine, { top: GRAPH_TOP + line * 54 }]} />
          ))}

          {points.slice(0, -1).map((point, index) => {
            const next = points[index + 1];
            const dx = next.x - point.x;
            const dy = next.y - point.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = `${Math.atan2(dy, dx)}rad`;
            return (
              <View
                key={`${point.day}-${next.day}`}
                style={[
                  styles.chartLine,
                  {
                    left: (point.x + next.x) / 2 - length / 2,
                    top: (point.y + next.y) / 2 - 2,
                    width: length,
                    transform: [{ rotateZ: angle }],
                  },
                ]}
              />
            );
          })}

          {points.map((point, index) => {
            const isLast = index === points.length - 1;
            const barHeight = GRAPH_TOP + GRAPH_HEIGHT - point.y + 18;
            return (
              <View key={point.day} style={[styles.chartPointColumn, { left: point.x - 18 }]}>
                <Text
                  style={[
                    styles.chartPointValue,
                    { top: Math.max(0, point.y - 38) },
                    isLast && styles.chartPointValueActive,
                  ]}
                >
                  {point.count}
                </Text>
                <View style={[styles.chartBar, { height: barHeight }]} />
                <View style={[styles.chartPoint, { top: point.y - 11 }, isLast && styles.chartPointActive]} />
                {isLast && <View style={[styles.todayGlow, { top: point.y - 27 }]} />}
                <Text style={[styles.chartDateLabel, isLast && styles.chartDateLabelActive]}>
                  {isLast ? t('profile.today', { defaultValue: 'Today' }) : formatChartDate(point.day, language)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dailyCountScroll}>
        {points.map((point) => (
          <View key={`count-${point.day}`} style={styles.dailyCountChip}>
            <Text style={styles.dailyCountDate}>{formatChartDate(point.day, language)}</Text>
            <Text style={styles.dailyCountValue}>
              {point.count} {metric === 'views'
                ? t('profile.viewsMetric', { defaultValue: 'Views' })
                : t('profile.callsMetric', { defaultValue: 'Calls' })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const SellerListingInsightsScreen = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { animalType, id } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [markingSold, setMarkingSold] = useState(false);
  const [activeMetric, setActiveMetric] = useState('views');

  const loadInsights = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await listingsService.getListingInsights(animalType, id);
      if (response?.success) {
        setInsights(response.data);
      }
    } catch (error) {
      if (!silent) {
        Alert.alert(
          t('common.error'),
          error?.message || t('profile.insightsLoadFailed', { defaultValue: 'Failed to load listing analytics' })
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [animalType, id, t]);

  useEffect(() => {
    loadInsights(false);
    const refreshTimer = setInterval(() => {
      loadInsights(true);
    }, 15000);

    return () => clearInterval(refreshTimer);
  }, [loadInsights]);

  const listing = insights?.listing;
  const summary = insights?.summary || {};
  const isSold = summary.isSold || listing?.status === 'sold';
  const imageUri = getImageUri(listing);
  const activeData = activeMetric === 'views' ? insights?.trends?.views || [] : insights?.trends?.calls || [];
  const activeTotal = activeMetric === 'views' ? summary.views : summary.calls;

  const recentActivity = useMemo(() => (
    (insights?.trends?.views || []).reduce((sum, item) => sum + Number(item.count || 0), 0) +
    (insights?.trends?.calls || []).reduce((sum, item) => sum + Number(item.count || 0), 0)
  ), [insights]);

  const handleShare = async () => {
    if (!listing) return;

    try {
      await Share.share({
        message: `${getLocalizedBreedName(listing, i18n.resolvedLanguage || i18n.language, t)} - ${formatCurrency(listing.price || listing.expected_price)}`,
      });
    } catch (error) {
      Alert.alert(t('common.error'), error?.message || t('profile.shareFailed', { defaultValue: 'Unable to share listing' }));
    }
  };

  const handleMarkAsSold = () => {
    if (!listing || isSold) return;

    Alert.alert(
      t('profile.soldQuestion', { defaultValue: 'Is your animal sold?' }),
      t('profile.markAsSoldConfirm', { breed: listing.breed || listing.breed_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.markAsSold'),
          onPress: async () => {
            setMarkingSold(true);
            try {
              const response = await listingsService.markListingAsSold(listing.animal_type, listing.id);
              if (response?.success) {
                Alert.alert(t('common.success'), t('profile.markAsSoldSuccess'));
                await loadInsights();
              }
            } catch (error) {
              Alert.alert(t('common.error'), error?.message || t('profile.markAsSoldError'));
            } finally {
              setMarkingSold(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('profile.loadingInsights', { defaultValue: 'Loading listing analytics...' })}</Text>
        </View>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.emptyBackButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyTitle}>{t('profile.insightsNotFound', { defaultValue: 'Listing insights not found' })}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <LiveBuyerMap
          listing={listing}
          summary={summary}
          buyerLocations={insights?.buyerLocations || []}
          imageUri={imageUri}
          navigation={navigation}
          t={t}
        />

        <ListingStatusCard
          listing={listing}
          summary={summary}
          imageUri={imageUri}
          isSold={isSold}
          onShare={handleShare}
          t={t}
          language={i18n.resolvedLanguage || i18n.language}
        />

        <MetricChart
          data={activeData}
          total={activeTotal}
          metric={activeMetric}
          onMetricChange={setActiveMetric}
          t={t}
          language={i18n.resolvedLanguage || i18n.language}
        />

        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>{summary.views || 0}</Text>
            <Text style={styles.quickStatLabel}>{t('profile.totalViews', { defaultValue: 'Total views' })}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={[styles.quickStatValue, { color: COLORS.accent }]}>{summary.calls || 0}</Text>
            <Text style={styles.quickStatLabel}>{t('profile.totalCalls', { defaultValue: 'Total calls' })}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={[styles.quickStatValue, { color: COLORS.primaryDeep }]}>{recentActivity}</Text>
            <Text style={styles.quickStatLabel}>{t('profile.recentActivity', { defaultValue: 'Recent activity' })}</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t('profile.recentBuyerCalls', { defaultValue: 'Recent buyer calls' })}</Text>
          {(insights?.recentCalls || []).length === 0 ? (
            <Text style={styles.panelEmpty}>{t('profile.noBuyerCallsYet', { defaultValue: 'No buyer calls yet.' })}</Text>
          ) : (
            insights.recentCalls.map((call) => (
              <View key={call.id} style={styles.callRow}>
                <View>
                  <Text style={styles.callName}>{call.buyerName}</Text>
                  <Text style={styles.callPhone}>{call.buyerPhone}</Text>
                </View>
                <Text style={styles.callStatus}>{getTranslatedCallStatus(call.status, t)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.soldPanel}>
          <Text style={styles.soldTitle}>{t('profile.soldQuestion', { defaultValue: 'Is your animal sold?' })}</Text>
          <View style={styles.soldActions}>
            <TouchableOpacity style={styles.notSoldButton} disabled>
              <Text style={styles.notSoldText}>{isSold ? t('profile.sold') : t('profile.notSoldYet', { defaultValue: 'Not sold yet' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.soldButton, (isSold || markingSold) && styles.soldButtonDisabled]}
              disabled={isSold || markingSold}
              onPress={handleMarkAsSold}
              activeOpacity={0.85}
            >
              <Text style={styles.soldButtonText}>
                {isSold ? t('profile.alreadySold', { defaultValue: 'Already sold' }) : t('profile.markAsSold')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  emptyBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 16,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  liveMap: {
    height: 438,
    backgroundColor: COLORS.surfaceAlt,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  mapRoadHorizontal: {
    position: 'absolute',
    left: -60,
    right: -60,
    height: 12,
    borderRadius: 99,
    backgroundColor: COLORS.surface,
  },
  mapRoadVertical: {
    position: 'absolute',
    top: -50,
    bottom: -50,
    width: 13,
    borderRadius: 99,
    backgroundColor: COLORS.surface,
  },
  mapBackButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 9,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  liveTopBar: {
    position: 'absolute',
    top: 51,
    left: 74,
    right: 126,
    zIndex: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  liveStatsBar: {
    position: 'absolute',
    top: 51,
    right: 14,
    zIndex: 8,
    flexDirection: 'row',
    gap: 6,
  },
  liveStatChip: {
    minWidth: 50,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  liveStatNumber: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  liveStatLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '800',
  },
  liveBadge: {
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    color: COLORS.white,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '900',
  },
  liveLocation: {
    maxWidth: 104,
    marginLeft: 9,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },
  centerPulseOuter: {
    position: 'absolute',
    top: 152,
    alignSelf: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(93,202,165,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPulseMiddle: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAnimal: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: COLORS.primarySoft,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAnimalImage: {
    width: '100%',
    height: '100%',
  },
  mapBuyerBubble: {
    position: 'absolute',
    zIndex: 6,
    alignItems: 'center',
  },
  buyerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: COLORS.surface,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 5,
  },
  buyerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  buyerAvatarText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    right: 2,
    top: 33,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  distanceChip: {
    marginTop: -3,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  distanceText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
  },
  realLocationHint: {
    position: 'absolute',
    left: 34,
    right: 34,
    top: 122,
    zIndex: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  realLocationHintText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  mapHeadline: {
    position: 'absolute',
    left: 34,
    right: 34,
    bottom: 58,
    alignItems: 'center',
  },
  mapHeadlineMuted: {
    color: COLORS.textMuted,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  mapHeadlineTitle: {
    color: COLORS.text,
    fontSize: 23,
    lineHeight: 29,
    textAlign: 'center',
    fontWeight: '900',
  },
  listingCard: {
    marginHorizontal: 16,
    marginTop: -44,
    zIndex: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  visibleBanner: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  soldBanner: {
    backgroundColor: COLORS.lightGray,
  },
  visibleBannerText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '900',
  },
  soldBannerText: {
    color: COLORS.textMuted,
  },
  listingCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listingThumb: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
  },
  listingThumbPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },
  listingPrice: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },
  listingMeta: {
    marginTop: 7,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  listingActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shareText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  miniStat: {
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  miniStatValue: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '900',
  },
  miniStatLabel: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '900',
  },
  chartTotal: {
    color: COLORS.accent,
  },
  metricToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    padding: 4,
  },
  metricToggleButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricToggleActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  metricToggleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  metricToggleTextActive: {
    color: COLORS.primaryDark,
  },
  chartScrollContent: {
    paddingTop: 12,
  },
  dailyCountScroll: {
    gap: 8,
    paddingTop: 10,
  },
  dailyCountChip: {
    minWidth: 88,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dailyCountDate: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '900',
  },
  dailyCountValue: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },
  chartCanvas: {
    height: 224,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  chartLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primaryDeep,
  },
  chartPointColumn: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 214,
    alignItems: 'center',
  },
  chartPointValue: {
    position: 'absolute',
    minWidth: 30,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 5,
    paddingVertical: 3,
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '900',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  chartPointValueActive: {
    color: COLORS.primary,
    fontSize: 16,
  },
  chartBar: {
    position: 'absolute',
    bottom: 33,
    width: 18,
    borderRadius: 999,
    backgroundColor: COLORS.lightGray,
  },
  chartPoint: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 5,
    borderColor: COLORS.primaryDeep,
    backgroundColor: COLORS.surface,
  },
  chartPointActive: {
    borderColor: COLORS.primary,
  },
  todayGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(29,158,117,0.18)',
  },
  chartDateLabel: {
    position: 'absolute',
    bottom: 0,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '900',
  },
  chartDateLabelActive: {
    color: COLORS.primaryDark,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 13,
    alignItems: 'center',
  },
  quickStatValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  quickStatLabel: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '800',
  },
  panel: {
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    padding: 16,
  },
  panelTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  panelEmpty: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    padding: 12,
    marginBottom: 8,
  },
  callName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
  },
  callPhone: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  callStatus: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  soldPanel: {
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    padding: 16,
  },
  soldTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  soldActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  notSoldButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: 14,
    alignItems: 'center',
  },
  notSoldText: {
    color: COLORS.error,
    fontWeight: '900',
  },
  soldButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    alignItems: 'center',
  },
  soldButtonDisabled: {
    backgroundColor: COLORS.borderStrong,
  },
  soldButtonText: {
    color: COLORS.white,
    fontWeight: '900',
  },
});

export default SellerListingInsightsScreen;
