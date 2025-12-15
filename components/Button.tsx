import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/Colors';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}) => {
    const getBackgroundColor = () => {
        if (disabled) return '#E0E0E0';
        switch (variant) {
            case 'primary': return Colors.primary;
            case 'secondary': return Colors.accent;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return Colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return '#A0A0A0';
        switch (variant) {
            case 'primary': return '#FFFFFF';
            case 'secondary': return '#FFFFFF';
            case 'outline': return Colors.primary;
            case 'ghost': return Colors.primary;
            default: return '#FFFFFF';
        }
    };

    const getBorder = () => {
        if (variant === 'outline') return { borderWidth: 1, borderColor: Colors.primary };
        return {};
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                getBorder(),
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    text: {
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        textAlign: 'center',
    },
});
