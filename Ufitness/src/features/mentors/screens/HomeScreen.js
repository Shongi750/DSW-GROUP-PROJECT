import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

export default function HomeScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>University Gym Mentorship</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Mentors')}>
                <Text style={styles.buttonText}>Find a Mentor</Text>
            </TouchableOpacity>
        </View>
    )
}

function createStyles(colors, isDark) {
    return StyleSheet.create({
        container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
        title: { ...display, fontSize: 26, color: colors.text, textAlign: 'center', textTransform: 'uppercase', marginBottom: 20 },
        button: {
            backgroundColor: colors.brand,
            borderRadius: 999,
            paddingVertical: 14,
            paddingHorizontal: 28,
        },
        buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
    });
}
