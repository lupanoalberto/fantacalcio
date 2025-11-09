import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useLeagueStore } from '../../store/leagueStore';
import { useNavigation } from '@react-navigation/native';

export default function CreateLeagueScreen() {
  const [name, setName] = useState('');
  const { addLeague } = useLeagueStore();
  const navigation = useNavigation();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await addLeague('user_123', name);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        Crea una nuova lega
      </Text>
      <TextInput
        placeholder="Nome della lega"
        value={name}
        onChangeText={setName}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />
      <Button title="Crea lega" onPress={handleCreate} />
    </View>
  );
}
