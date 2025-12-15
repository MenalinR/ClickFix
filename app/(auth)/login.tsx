import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const role = params.role as string || 'customer';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Determine route based on role
        if (role === 'worker') {
            router.replace('/(worker)' as any);
        } else {
            router.replace('/(customer)' as any);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                    Login as {role === 'worker' ? 'Service Professional' : 'Customer'}
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="#999"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <Button title="Log In" onPress={handleLogin} style={styles.button} />

                    <Button
                        title="Create Account"
                        variant="ghost"
                        onPress={() => router.push({ pathname: '/(auth)/signup', params: { role } })}
                    />
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        color: Colors.textSecondary,
        marginBottom: 40,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.text,
    },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
    },
    button: {
        marginTop: 10,
    },
    backBtn: {
        marginBottom: 24,
    },
});
