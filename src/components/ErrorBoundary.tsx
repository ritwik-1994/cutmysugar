import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Global Error Boundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    resetError = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.subtitle}>Global Error Boundary</Text>

                        <View style={styles.box}>
                            <Text style={styles.label}>Error:</Text>
                            <Text style={styles.text}>{this.state.error?.toString()}</Text>
                        </View>

                        {this.state.errorInfo && (
                            <View style={styles.box}>
                                <Text style={styles.label}>Stack:</Text>
                                <Text style={styles.text}>{this.state.errorInfo.componentStack}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.button} onPress={this.resetError}>
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FEE2E2', // Light red
        paddingTop: 50,
        paddingHorizontal: 20
    },
    content: {
        paddingBottom: 40
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#991B1B',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: '#7F1D1D',
        marginBottom: 20
    },
    box: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FAC7C7'
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333'
    },
    text: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#333'
    },
    button: {
        backgroundColor: '#991B1B',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold'
    }
});
