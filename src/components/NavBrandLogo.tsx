import React from 'react';
import { Image, View } from 'react-native';
import { radius } from '../theme';

const NAIM_LOGO = require('../../assets/naim1.png');

export const NAV_BRAND_LOGO_SIZE = 100;

type NavBrandLogoProps = {
  size?: number;
};

export function NavBrandLogo({ size = NAV_BRAND_LOGO_SIZE }: NavBrandLogoProps) {
  return (
    <View
      style={{
        minHeight: size + 4,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={NAIM_LOGO}
        style={{ width: size, height: size, borderRadius: radius.md }}
        resizeMode="contain"
      />
    </View>
  );
}
