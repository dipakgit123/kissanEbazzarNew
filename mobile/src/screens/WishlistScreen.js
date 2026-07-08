import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, formatPrice, getAnimalTypeIcon } from '../utils/constants';
import { useWishlist } from '../context/WishlistContext';
import { callLogService } from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import AppHeader from '../components/AppHeader';

const CATEGORY_ORDER = ['all', 'cow', 'buffalo', 'goat', 'horse', 'dog', 'cat', 'other'];
const ITEM_DOT = '\u00B7';

const WishlistScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { wishlist, removeFromWishlist, clearWishlist, loading } = useWishlist();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getImageUrl = (item) =>
    item.front_photo ||
    item.frontPhoto ||
    item.side_photo ||
    item.sidePhoto ||
    item.photo_1 ||
    item.photo1 ||
    item.photo_url ||
    item.photoUrl ||
    (Array.isArray(item.photos) ? item.photos[0] : null) ||
    null;

  const getAnimalType = (item) => (item.animal_type || item.animalType || 'other').toLowerCase();

  const getAnimalTypeLabel = (type) =>
    t(`animalTypes.${type}`, {
      defaultValue: type ? type.charAt(0).toUpperCase() + type.slice(1) : t('wishlist.otherAnimals'),
    });

  const getBreedName = (item) =>
    item.breed_name || item.breedName || item.breed || t('buyAnimals.unknownBreed');

  const getSellerName = (item) =>
    item.seller?.full_name ||
    item.seller?.name ||
    item.sellerName ||
    item.full_name ||
    t('wishlist.unknownSeller');

  const getSellerPhone = (item) => item.seller?.phone || item.phone || item.phone_number || null;

  const getPrice = (item) => item.expected_price || item.expectedPrice || item.price || 0;

  const getLocationLabel = (item) =>
    [item.city, item.state].filter(Boolean).join(', ') || t('profile.locationNotSpecified');

  const getDistanceLabel = (item) => {
    const numericDistance = Number(item.distance);
    if (!Number.isFinite(numericDistance) || numericDistance <= 0) {
      return null;
    }

    return t('buyAnimals.kmAway', { distance: Math.round(numericDistance) });
  };

  const getPostedLabel = (item) => {
    const createdAt = item.created_at || item.createdAt || item.addedAt;
    if (!createdAt) {
      return null;
    }

    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t('buyAnimals.justNow');
    }
    if (diffMins < 60) {
      return t('buyAnimals.minutesAgo', { count: diffMins });
    }
    if (diffHours < 24) {
      return t('buyAnimals.hoursAgo', { count: diffHours });
    }
    if (diffDays < 7) {
      return t('buyAnimals.daysAgo', { count: diffDays });
    }

    return t('buyAnimals.weeksAgo', { count: Math.max(1, Math.floor(diffDays / 7)) });
  };

  const getGenderLabel = (item) => {
    const rawGender = (item.gender || '').toString().trim().toLowerCase();
    if (!rawGender) {
      return null;
    }

    if (rawGender === 'male') {
      return t('common.male');
    }
    if (rawGender === 'female') {
      return t('common.female');
    }

    return item.gender;
  };

  const isNegotiable = (item) =>
    item.price_negotiable === true ||
    item.price_negotiable === 'true' ||
    item.negotiable === true ||
    item.negotiable === 'true' ||
    item.is_negotiable === true ||
    item.is_negotiable === 'true';

  const categoryCounts = useMemo(() => {
    const counts = wishlist.reduce((acc, item) => {
      const type = getAnimalType(item);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return { all: wishlist.length, ...counts };
  }, [wishlist]);

  const categoryItems = useMemo(() => {
    const dynamicTypes = CATEGORY_ORDER.filter(
      (type) => type === 'all' || (categoryCounts[type] || 0) > 0
    );

    return dynamicTypes.map((type) => ({
      key: type,
      label: type === 'all' ? t('wishlist.allAnimals') : getAnimalTypeLabel(type),
      count: categoryCounts[type] || 0,
    }));
  }, [categoryCounts, t]);

  const filteredWishlist = useMemo(() => {
    if (selectedCategory === 'all') {
      return wishlist;
    }

    return wishlist.filter((item) => getAnimalType(item) === selectedCategory);
  }, [selectedCategory, wishlist]);

  const handleRemove = (item) => {
    Alert.alert(
      t('wishlist.removeFromWishlist'),
      t('wishlist.removeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('wishlist.remove'),
          style: 'destructive',
          onPress: async () => {
            await removeFromWishlist(item.id || item.animal_id, item.animal_type || item.animalType);
          },
        },
      ]
    );
  };

  const handleClearWishlist = () => {
    if (!wishlist.length) {
      return;
    }

    Alert.alert(
      t('wishlist.clearWishlist'),
      t('wishlist.clearWishlistConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('wishlist.clearAll'),
          style: 'destructive',
          onPress: async () => {
            await clearWishlist();
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const handleItemPress = (item) => {
    navigation.navigate('AnimalDetail', {
      animalType: getAnimalType(item),
      id: item.animal_id || item.id,
    });
  };

  const logLead = async (item) => {
    const sellerPhone = getSellerPhone(item);
    if (!sellerPhone) {
      return;
    }

    try {
      await callLogService.logCall({
        receiverId: item.seller?.id || item.user_id,
        receiverPhoneNumber: sellerPhone,
        callType: 'direct',
        listingId: item.animal_id || item.id,
        listingType: getAnimalType(item),
      });
    } catch (error) {
      console.error('Error logging wishlist lead:', error);
    }
  };

  const handleCall = async (item) => {
    const sellerPhone = getSellerPhone(item);
    if (!sellerPhone) {
      return;
    }

    await logLead(item);
    Linking.openURL(`tel:${sellerPhone}`);
  };

  const handleWhatsApp = async (item) => {
    const sellerPhone = getSellerPhone(item);
    if (!sellerPhone) {
      return;
    }

    const message = `Hi! I'm interested in your ${getBreedName(item)} ${getAnimalTypeLabel(getAnimalType(item))}.`;
    await logLead(item);

    const normalizedPhone = sellerPhone.replace('+', '');
    const url = `whatsapp://send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`);
    });
  };

  const renderCategoryChip = ({ key, label, count }) => {
    const active = selectedCategory === key;

    return (
      <TouchableOpacity
        key={key}
        style={[styles.categoryChip, active && styles.categoryChipActive]}
        activeOpacity={0.85}
        onPress={() => setSelectedCategory(key)}
      >
        <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
          {key === 'all' ? `${label} (${count})` : label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFeaturedCard = (item) => {
    const imageUrl = getImageUrl(item);
    const animalType = getAnimalType(item);
    const breedName = getBreedName(item);
    const sellerName = getSellerName(item);
    const sellerInitial = sellerName.charAt(0)?.toLowerCase() || 's';
    const price = getPrice(item);
    const distanceLabel = getDistanceLabel(item);
    const postedLabel = getPostedLabel(item);
    const genderLabel = getGenderLabel(item);
    const milkCapacity = item.milk_capacity || item.milkCapacity;

    return (
      <TouchableOpacity style={styles.featuredCard} activeOpacity={0.92} onPress={() => handleItemPress(item)}>
        <View style={styles.featuredMedia}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.featuredImage} />
          ) : (
            <View style={styles.featuredPlaceholder}>
              <Text style={styles.featuredPlaceholderIcon}>{getAnimalTypeIcon(animalType)}</Text>
            </View>
          )}

          <View style={styles.featuredTopRow}>
            <View style={styles.featuredPriceChip}>
              <Text style={styles.featuredPriceChipText}>{`\u20B9${formatPrice(price)}`}</Text>
            </View>

            <TouchableOpacity
              style={styles.removeFab}
              onPress={(event) => {
                event.stopPropagation();
                handleRemove(item);
              }}
            >
              <Ionicons name="heart" size={18} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.featuredOverlayCenter}>
            {!imageUrl ? <Text style={styles.featuredCenterEmoji}>{getAnimalTypeIcon(animalType)}</Text> : null}
          </View>

          <View style={styles.featuredBottomMeta}>
            {isNegotiable(item) ? (
              <View style={styles.metaPillWarm}>
                <Text style={styles.metaPillWarmText}>{t('animalCard.negotiable')}</Text>
              </View>
            ) : null}

            {milkCapacity ? (
              <View style={styles.metaPillCool}>
                <Text style={styles.metaPillCoolText}>{`${milkCapacity}L/day`}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle} numberOfLines={1}>
            {`${breedName} | ${getAnimalTypeLabel(animalType)}`}
          </Text>

          <Text style={styles.featuredSubtitle} numberOfLines={1}>
            {[breedName, getAnimalTypeLabel(animalType), genderLabel].filter(Boolean).join(' • ')}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoInline}>
              <Ionicons name="location-outline" size={13} color={COLORS.primary} />
              <Text style={styles.infoText} numberOfLines={1}>{getLocationLabel(item)}</Text>
            </View>

            {postedLabel ? (
              <View style={styles.infoInline}>
                <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.infoText} numberOfLines={1}>{postedLabel}</Text>
              </View>
            ) : null}

            {distanceLabel ? (
              <View style={styles.infoInline}>
                <Ionicons name="navigate-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.infoText} numberOfLines={1}>{distanceLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.sellerRow}>
            <View style={styles.sellerIdentity}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>{sellerInitial}</Text>
              </View>
              <Text style={styles.sellerName} numberOfLines={1}>{sellerName}</Text>
            </View>
          </View>

          <View style={styles.featuredActions}>
            <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item)} activeOpacity={0.85}>
              <Ionicons name="call-outline" size={16} color={COLORS.surface} />
              <Text style={styles.actionText}>{t('animalCard.call')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whatsAppButton} onPress={() => handleWhatsApp(item)} activeOpacity={0.85}>
              <Ionicons name="logo-whatsapp" size={16} color={COLORS.surface} />
              <Text style={styles.actionText}>{t('animalCard.whatsapp')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewIconButton}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.85}
            >
              <Ionicons name="eye-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCompactCard = (item) => {
    const imageUrl = getImageUrl(item);
    const animalType = getAnimalType(item);
    const breedName = getBreedName(item);
    const price = getPrice(item);
    const distanceLabel = getDistanceLabel(item);

    return (
      <TouchableOpacity style={styles.compactCard} activeOpacity={0.9} onPress={() => handleItemPress(item)}>
        <View style={styles.compactMediaWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.compactImage} />
          ) : (
            <View style={styles.compactPlaceholder}>
              <Text style={styles.compactPlaceholderIcon}>{getAnimalTypeIcon(animalType)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.compactRemoveButton}
            onPress={(event) => {
              event.stopPropagation();
              handleRemove(item);
            }}
          >
            <Ionicons name="heart" size={14} color={COLORS.surface} />
          </TouchableOpacity>
        </View>

        <View style={styles.compactContent}>
          <View style={styles.compactHeaderRow}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {`${breedName} ${getAnimalTypeLabel(animalType)}`}
            </Text>
          </View>

          <View style={styles.compactInfoRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.compactInfoText} numberOfLines={1}>
              {distanceLabel ? `${getLocationLabel(item)} ${ITEM_DOT} ${distanceLabel}` : getLocationLabel(item)}
            </Text>
          </View>

          <View style={styles.compactBottomRow}>
            <Text style={styles.compactPrice}>{`\u20B9${formatPrice(price)}`}</Text>
            <View style={styles.compactActionRow}>
              <TouchableOpacity style={styles.compactCallBtn} onPress={() => handleCall(item)}>
                <Ionicons name="call-outline" size={12} color={COLORS.surface} />
                <Text style={styles.compactActionText}>{t('animalCard.call')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.compactWhatsAppBtn} onPress={() => handleWhatsApp(item)}>
                <Ionicons name="logo-whatsapp" size={12} color={COLORS.surface} />
                <Text style={styles.compactActionText}>{t('animalCard.whatsapp')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <>
      <AppHeader
        navigation={navigation}
        title={t('wishlist.title')}
        subtitle={t('wishlist.savedAnimalsCount', { count: wishlist.length })}
        rightActions={[
          {
            icon: 'trash-outline',
            onPress: handleClearWishlist,
            disabled: !wishlist.length,
            color: wishlist.length ? COLORS.error : COLORS.borderStrong,
            accessibilityLabel: 'Clear wishlist',
          },
        ]}
      />
      <View style={styles.headerSection}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <View style={styles.summaryIconWrap}>
            <Ionicons name="heart-outline" size={18} color={COLORS.error} />
          </View>
          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryTitle}>{t('wishlist.savedAnimalsCount', { count: wishlist.length })}</Text>
            <Text style={styles.summarySubtitle}>{t('wishlist.savedAnimalsSubtitle')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.summaryActionChip, !wishlist.length && styles.summaryActionChipDisabled]}
          onPress={handleClearWishlist}
          disabled={!wishlist.length}
          activeOpacity={0.85}
        >
          <Text style={[styles.summaryActionText, !wishlist.length && styles.summaryActionTextDisabled]}>
            {t('wishlist.clearAll')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={categoryItems}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => renderCategoryChip(item)}
        contentContainerStyle={styles.categoryRow}
        showsHorizontalScrollIndicator={false}
      />
      </View>
    </>
  );

  const renderQuickContactCard = () => {
    if (!filteredWishlist.length) {
      return null;
    }

    return (
      <View style={styles.quickCard}>
        <View style={styles.quickIconWrap}>
          <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
        </View>
        <View style={styles.quickTextWrap}>
          <Text style={styles.quickTitle}>{t('wishlist.quickContactTitle')}</Text>
          <Text style={styles.quickSubtitle}>{t('wishlist.quickContactSubtitle')}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyHeartWrap}>
        <Ionicons name="heart-dislike-outline" size={34} color={COLORS.error} />
      </View>
      <Text style={styles.emptyTitle}>
        {wishlist.length === 0 ? t('wishlist.emptyTitle') : t('wishlist.emptyFilteredTitle')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {wishlist.length === 0 ? t('wishlist.emptySubtitle') : t('wishlist.emptyFilteredSubtitle')}
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('BuyAnimals')}
      >
        <Ionicons name="search-outline" size={16} color={COLORS.surface} />
        <Text style={styles.browseButtonText}>{t('wishlist.browseAnimals')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonLoader variant="animalList" count={4} />
        </View>
      );
    }

    if (!filteredWishlist.length) {
      return renderEmpty();
    }

    const [featuredItem, ...compactItems] = filteredWishlist;

    return (
      <View style={styles.contentSection}>
        {renderFeaturedCard(featuredItem)}
        {compactItems.map((item) => (
          <View key={`${getAnimalType(item)}-${item.animal_id || item.id}`} style={styles.compactCardWrap}>
            {renderCompactCard(item)}
          </View>
        ))}
        {renderQuickContactCard()}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ key: 'wishlist-content' }]}
        keyExtractor={(item) => item.key}
        renderItem={() => renderContent()}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={{ paddingBottom: 116 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    flex: 1,
    marginHorizontal: 14,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFECEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  summarySubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  summaryActionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF0F0',
  },
  summaryActionChipDisabled: {
    backgroundColor: COLORS.surfaceAlt,
  },
  summaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  summaryActionTextDisabled: {
    color: COLORS.borderStrong,
  },
  categoryRow: {
    gap: 10,
    paddingBottom: 6,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryChipActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  categoryChipTextActive: {
    color: COLORS.surface,
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  featuredCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  featuredMedia: {
    height: 210,
    backgroundColor: '#DDF7E8',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredPlaceholderIcon: {
    fontSize: 82,
  },
  featuredTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredPriceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  featuredPriceChipText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  removeFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
  },
  featuredOverlayCenter: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCenterEmoji: {
    fontSize: 76,
  },
  featuredBottomMeta: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaPillWarm: {
    backgroundColor: COLORS.warningSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaPillWarmText: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  metaPillCool: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaPillCoolText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  featuredSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  infoInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    maxWidth: 110,
  },
  sellerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sellerAvatarText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  sellerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  featuredActions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  callButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  whatsAppButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.surface,
  },
  viewIconButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  compactCardWrap: {
    marginTop: 12,
  },
  compactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  compactMediaWrap: {
    width: 84,
    height: 84,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F7ECE7',
    position: 'relative',
  },
  compactImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  compactPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactPlaceholderIcon: {
    fontSize: 44,
  },
  compactRemoveButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  compactTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  compactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  compactInfoText: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  compactBottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  compactActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  compactCallBtn: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  compactWhatsAppBtn: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  compactActionText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  quickCard: {
    marginTop: 14,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quickIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginRight: 10,
  },
  quickTextWrap: {
    flex: 1,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  quickSubtitle: {
    marginTop: 3,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 26,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyHeartWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FFECEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  browseButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  loadingContainer: {
    paddingTop: 64,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});

export default WishlistScreen;
