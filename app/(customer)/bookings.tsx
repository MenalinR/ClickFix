import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../constants/Store';
import { Colors } from '../../constants/Colors';

export default function BookingsScreen() {
    const { jobs } = useStore();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return '#FFC107';
            case 'Accepted': return '#28A745';
            case 'Rejected': return '#DC3545';
            case 'Completed': return Colors.primary;
            default: return Colors.textSecondary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>My Bookings</Text>
            <FlatList
                data={jobs}
                keyExtractor={j => j.id}
                contentContainerStyle={{ padding: 24 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.service}>{item.service}</Text>
                            <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                        </View>
                        <Text style={styles.worker}>Professional: {item.workerName}</Text>
                        <Text style={styles.desc}>{item.description}</Text>
                        <Text style={styles.date}>{item.date}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    heading: { fontSize: 24, fontFamily: 'Inter_700Bold', padding: 24, paddingBottom: 0 },
    card: { backgroundColor: Colors.white, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    service: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
    status: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    worker: { color: Colors.text, marginBottom: 4 },
    desc: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8 },
    date: { color: '#999', fontSize: 12 }
});
