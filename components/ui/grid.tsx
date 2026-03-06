import { View } from "@/components/ui/view";
import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

type RowProps = {
  children: React.ReactNode;
  gutter?: number;
  style?: StyleProp<ViewStyle>;
};

// Row acts like a 12-column container: it wraps children and applies negative
// margins so each Col can add equal left/right padding (gutter) without
// increasing the overall row width.
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
        // Pass the gutter down so each Col can apply matching horizontal padding.
        return React.cloneElement(child, { gutter } as { gutter: number });
      })}
    </View>
  );
}

type ColProps = {
  span: number; // 1..12
  gutter?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

// Col consumes a portion of the 12-column grid. Width is computed by
// span/12 and expressed as a percentage so it responds to container size.
export function Col({ span, gutter = 16, style, children }: ColProps) {
  const clampedSpan = Math.max(1, Math.min(12, span));
  const width = `${(clampedSpan * 100) / 12}%` as `${number}%`;
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
