import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { THEME } from '../../content/v0';
import { t } from '../lib/i18n';

interface Props {
  onPress: () => void;
}

/**
 * Big speaker button that pulses gently to invite the first tap each round.
 */
export function AudioButton({ onPress }: Props) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, [pulse]);

  const aniStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.column}>
      <Animated.View style={aniStyle}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={t('audio_button_label')}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: THEME.colors.accent,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          <Text style={styles.icon}>🔊</Text>
        </Pressable>
      </Animated.View>
      <Text style={styles.caption}>{t('audio_button_label')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: 'center',
  },
  btn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    fontSize: 44,
    color: '#fff',
  },
  caption: {
    marginTop: THEME.spacing.sm,
    color: THEME.colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
});
