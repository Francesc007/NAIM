import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ componentStack: errorInfo.componentStack ?? '' });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const loc = this.state.componentStack?.split('\n')[1]?.trim() ?? this.state.error?.stack?.split('\n')[1]?.trim() ?? 'desconocido';
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.label}>Archivo / componente:</Text>
          <Text style={styles.detail} selectable>{loc}</Text>
          <Text style={styles.label}>Error:</Text>
          <Text style={styles.message} selectable>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  detail: {
    fontSize: 11,
    color: '#b45309',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#B00020',
    textAlign: 'center',
  },
});
