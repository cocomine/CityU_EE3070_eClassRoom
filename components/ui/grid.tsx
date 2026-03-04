import React from 'react';
import { View, ViewStyle } from 'react-native';

type RowProps = {
  children: React.ReactNode;
  gutter?: number;
  style?: ViewStyle;
};

export function Row({ children, gutter = 16, style }: RowProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -gutter / 2,
        },
        style,
      ]}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, { gutter } as { gutter: number });
      })}
    </View>
  );
}

type ColProps = {
  span: number; // 1..12
  gutter?: number;
  style?: ViewStyle;
  children: React.ReactNode;
};

export function Col({ span, gutter = 16, style, children }: ColProps) {
  const width = `${Math.max(1, Math.min(12, span)) * (100 / 12)}%`;
  return (
    <View
      style={[
        {
          width,
          paddingHorizontal: gutter / 2,
          marginBottom: gutter,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
