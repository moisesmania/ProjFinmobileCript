

import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(10000);
  const [btcAmount, setBtcAmount] = useState<number>(0);
  const [history, setHistory] = useState<{ type: string; amount: number }[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [user, setUser] = useState<string>('Usuário');

  // Verifica se há usuário logado
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('@logged_user');
      if (!storedUser) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        setUser(storedUser);
      }
    };
    loadUser();
    fetchPrice();
  }, []);

  // Função para formatar número
  const formatNumber = (num: number, decimals = 6) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const fetchPrice = async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const res = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl'
      );
      setBtcPrice(res.data.bitcoin.brl);
    } catch (err: any) {
      if (err.response?.status === 429) {
        Alert.alert('Limite de requisições', 'Aguarde alguns segundos.');
      } else {
        Alert.alert('Erro', 'Erro ao buscar o preço do BTC.');
      }
    } finally {
      setTimeout(() => setIsFetching(false), 10000);
    }
  };

  const buyBTC = () => {
    if (!btcPrice) return;
    if (balance < 100) {
      Alert.alert('Saldo insuficiente', 'Você precisa de pelo menos R$ 100.');
      return;
    }
    const btcToBuy = 100 / btcPrice;
    setBalance((prev) => prev - 100);
    setBtcAmount((prev) => prev + btcToBuy);
    setHistory((prev) => [{ type: 'compra', amount: btcToBuy }, ...prev]);
  };

  const sellBTC = () => {
    if (btcAmount <= 0 || !btcPrice) return;
    const btcToSell = btcAmount / 2;
    setBtcAmount((prev) => prev - btcToSell);
    setBalance((prev) => prev + btcToSell * btcPrice);
    setHistory((prev) => [{ type: 'venda', amount: btcToSell }, ...prev]);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@logged_user');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleDeleteAccount = async () => {
    Alert.alert('Excluir Conta', 'Tem certeza que deseja excluir sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const usersRaw = await AsyncStorage.getItem('@users_list');
            if (usersRaw) {
              const users = JSON.parse(usersRaw);
              const updated = users.filter((u: any) => u.nome !== user);
              await AsyncStorage.setItem('@users_list', JSON.stringify(updated));
            }
            await AsyncStorage.removeItem('@logged_user');
            Alert.alert('Conta excluída com sucesso!');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch {
            Alert.alert('Erro ao excluir conta.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, {user}</Text>
      <Text style={styles.text}>Saldo (R$): {formatNumber(balance, 2)}</Text>
      <Text style={styles.text}>
        Preço do BTC: {btcPrice ? `R$ ${formatNumber(btcPrice, 6)}` : 'Carregando...'}
      </Text>
      <Text style={styles.text}>BTC Comprado: {formatNumber(btcAmount, 6)}</Text>

      <View style={styles.buttons}>
        <Button title="ATUALIZAR PREÇO" onPress={fetchPrice} disabled={isFetching} />
        <Button title="COMPRAR" onPress={buyBTC} />
        <Button title="VENDER" onPress={sellBTC} />
        <Button title="SAIR" onPress={handleLogout} />
        <Button title="EXCLUIR CONTA" color="red" onPress={handleDeleteAccount} />
      </View>

      <Text style={styles.subtitle}>Histórico de Transações</Text>
      <ScrollView>
        {history.map((item, index) => (
          <Text key={index} style={styles.historyText}>
            {item.type === 'compra' ? 'Compra' : 'Venda'} de {formatNumber(item.amount, 6)} BTC
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 20,
  },
  title: {
    fontSize: 26,
    color: '#fff',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 20,
    color: '#ccc',
    fontSize: 18,
    marginBottom: 8,
  },
  historyText: {
    color: '#aaa',
    fontSize: 14,
  },
  buttons: {
    marginVertical: 16,
    gap: 10,
  },
});
