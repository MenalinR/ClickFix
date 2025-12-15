import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/Button';

export default function SignupScreen() {
    const router = useRouter();
    const { role } = useLocalSearchParams();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                    Join as a {role === 'worker' ? 'Service Professional' : 'Customer'}
                </Text>

                <View style={styles.form}>
                    <TextInput style={styles.input} placeholder="Full Name" />
                    <TextInput style={styles.input} placeholder="Email" />
                    <TextInput style={styles.input} placeholder="Password" secureTextEntry />

                    <Button title="Sign Up" onPress={() => router.back()} />
                    <Button title="Back to Login" variant="ghost" onPress={() => router.back()} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontFamily: 'Inter_700Bold',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 32,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
    },
});
