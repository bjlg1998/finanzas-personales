import { useTheme } from "../../theme/ThemeProvider";
import { Sheet } from "../../components/ui";
import { Pressable, Text, View } from 'react-native';
import { THEMES } from "../../theme/palettes";
export default function ThemeSheet({
  sheet,
  closeSheet,
  data,
  setData
}) {
  const {
    styles
  } = useTheme();
  return <Sheet visible={sheet === 'theme'} onClose={closeSheet} title="Elige tus colores">
        <View style={styles.themeGrid}>
          {Object.entries(THEMES).map(([key, palette]) => <Pressable key={key} style={[styles.themeOption, data.theme === key && {
        borderColor: palette.mint
      }]} onPress={() => {
        setData(d => ({
          ...d,
          theme: key
        }));
        closeSheet();
      }}>
              <View style={[styles.themeSwatch, {
          backgroundColor: palette.bg
        }]}>
                <View style={[styles.themeDot, {
            backgroundColor: palette.mint
          }]} />
                <View style={[styles.themeDot, {
            backgroundColor: palette.gold
          }]} />
              </View>
              <Text style={styles.themeName}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            </Pressable>)}
        </View>
      </Sheet>;
}
