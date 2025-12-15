import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Customer Profile</Text>
            <Button title="Logout" onPress={() => router.replace('/')} variant="outline" />
        </SafeAreaView>
    );
}
