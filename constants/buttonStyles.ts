import { StyleSheet } from 'react-native';

export const BUTTON_STYLES = StyleSheet.create({
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4d1904',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '400' as const,
    color: '#ffffff',
  },
});
