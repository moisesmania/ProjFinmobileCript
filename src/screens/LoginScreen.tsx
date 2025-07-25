
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  TextInput,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type User = {
  nome: string;
  email: string;
  senha: string;
};

const STORAGE_KEY = '@users_list';

export default function LoginScreen({ navigation }: Props) {
  const [isRegistering, setIsRegistering] = useState(true);

  // Cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');

  // Login
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  // Reset senha
  const [resetNome, setResetNome] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [showReset, setShowReset] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loggedUser, setLoggedUser] = useState<User | null>(null);

  // Carrega usuários
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const storedUsers = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedUsers) setUsers(JSON.parse(storedUsers));
      } catch (e) {
        console.error('Erro ao carregar usuários', e);
      }
    };
    loadUsers();
  }, []);

  const saveUsers = async (usersToSave: User[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(usersToSave));
    } catch (e) {
      console.error('Erro ao salvar usuários', e);
    }
  };

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  // Cadastro
  const handleRegister = () => {
    if (!nome || !email || !senhaCadastro) {
      Alert.alert('Erro', 'Preencha todos os campos para cadastro');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Erro', 'Informe um email válido');
      return;
    }
    if (users.some(u => u.nome === nome)) {
      Alert.alert('Erro', 'Usuário já cadastrado');
      return;
    }
    const newUser = { nome, email, senha: senhaCadastro };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    Alert.alert('Sucesso', 'Cadastro realizado! Agora faça login.');
    setNome('');
    setEmail('');
    setSenhaCadastro('');
    setIsRegistering(false);
  };

  // Login
  const handleLogin = async () => {
    if (!usuarioLogin || !senhaLogin) {
      Alert.alert('Erro', 'Preencha usuário e senha');
      return;
    }
    const userFound = users.find(u => u.nome === usuarioLogin && u.senha === senhaLogin);
    if (!userFound) {
      Alert.alert('Erro', 'Usuário ou senha inválidos');
      return;
    }
    // Salva usuário logado no AsyncStorage para persistência
    await AsyncStorage.setItem('@logged_user', userFound.nome);

    setLoggedUser(userFound);
    setUsuarioLogin('');
    setSenhaLogin('');
    setShowReset(false);

    // Navega para Home (Bitcoin)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home', params: { user: userFound.nome } }],
    });
  };

  // Logout
  const handleLogout = () => {
    setLoggedUser(null);
    setIsRegistering(false);
    // Limpa todos campos
    setNome('');
    setEmail('');
    setSenhaCadastro('');
    setUsuarioLogin('');
    setSenhaLogin('');
    setResetNome('');
    setResetEmail('');
    setNovaSenha('');
    setShowReset(false);
  };

  // Reset senha
  const handleResetSenha = () => {
    if (!resetNome || !resetEmail || !novaSenha) {
      Alert.alert('Erro', 'Preencha todos os campos para redefinir a senha');
      return;
    }
    const userIndex = users.findIndex(u => u.nome === resetNome && u.email === resetEmail);
    if (userIndex === -1) {
      Alert.alert('Erro', 'Usuário e email não conferem');
      return;
    }
    const updatedUsers = [...users];
    updatedUsers[userIndex].senha = novaSenha;
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    Alert.alert('Sucesso', 'Senha redefinida! Agora faça login.');
    // Limpa campos reset e volta para login
    setResetNome('');
    setResetEmail('');
    setNovaSenha('');
    setShowReset(false);
    setIsRegistering(false);
  };

  // Excluir usuário logado
  const handleExcluirUsuario = () => {
    if (!loggedUser) return;
    Alert.alert(
      'Confirmação',
      'Deseja realmente excluir sua conta? Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            const updatedUsers = users.filter(u => u.nome !== loggedUser.nome);
            setUsers(updatedUsers);
            saveUsers(updatedUsers);
            handleLogout();
            Alert.alert('Conta excluída com sucesso');
          },
        },
      ]
    );
  };

  // Interface principal (usuário logado)
  if (loggedUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bem-vindo, {loggedUser.nome}!</Text>
        <Button title="Logout" onPress={handleLogout} />
        <View style={{ marginTop: 20 }}>
          <Button title="Excluir minha conta" color="red" onPress={handleExcluirUsuario} />
        </View>
      </View>
    );
  }

  // Tela Reset senha
  if (showReset) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Redefinir Senha</Text>
        <TextInput
          placeholder="Nome"
          value={resetNome}
          onChangeText={setResetNome}
          style={styles.input}
          placeholderTextColor="#aaa"
          autoCapitalize="words"
        />
        <TextInput
          placeholder="Email"
          value={resetEmail}
          onChangeText={setResetEmail}
          style={styles.input}
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Nova senha"
          value={novaSenha}
          onChangeText={setNovaSenha}
          style={styles.input}
          placeholderTextColor="#aaa"
          secureTextEntry
        />
        <Button title="Redefinir senha" onPress={handleResetSenha} />
        <Text style={styles.toggleText} onPress={() => setShowReset(false)}>
          Voltar ao login
        </Text>
      </View>
    );
  }

  // Tela Login / Cadastro
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simulador de Bitcoin</Text>

      {isRegistering ? (
        <>
          <TextInput
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
            placeholderTextColor="#aaa"
            autoCapitalize="words"
          />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Senha"
            value={senhaCadastro}
            onChangeText={setSenhaCadastro}
            style={styles.input}
            placeholderTextColor="#aaa"
            secureTextEntry
          />
          <Button title="Cadastrar" onPress={handleRegister} />
          <Text style={styles.toggleText} onPress={() => setIsRegistering(false)}>
            Já tem login? Faça o login aqui
          </Text>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Usuário"
            value={usuarioLogin}
            onChangeText={setUsuarioLogin}
            style={styles.input}
            placeholderTextColor="#aaa"
            autoCapitalize="words"
          />
          <TextInput
            placeholder="Senha"
            value={senhaLogin}
            onChangeText={setSenhaLogin}
            style={styles.input}
            placeholderTextColor="#aaa"
            secureTextEntry
          />
          <Button title="Entrar" onPress={handleLogin} />
          <Text style={styles.toggleText} onPress={() => setShowReset(true)}>
            Esqueci a senha
          </Text>
          <Text style={styles.toggleText} onPress={() => setIsRegistering(true)}>
            Ainda não tem login? Cadastre-se aqui
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  toggleText: {
    color: '#3dd56d',
    marginTop: 15,
    textDecorationLine: 'underline',
  },
});
