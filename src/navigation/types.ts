import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  AddGarment: undefined;
  Suggestions: undefined;
  Settings: undefined;
  PrivacyNotice: undefined;
};

export type TabParamList = {
  Home: undefined;
  Add: undefined;
  Wardrobe: { highlightGarmentId?: string } | undefined;
};
