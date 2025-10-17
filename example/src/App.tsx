import React, { useEffect } from "react"
import {
    Alert,
    Button,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native"
import {
    initialize,
    identify,
    triggerCreative,
    clearUser,
    recordProductViewEvent,
    recordAddToCartEvent,
    recordPurchaseEvent,
    recordCustomEvent,
    invokeAttentiveDebugHelper,
    exportDebugLogs,
    type AttentiveSdkConfiguration,
    type UserIdentifiers,
} from "@attentive-mobile/attentive-react-native-sdk"

function App(): React.JSX.Element {
    useEffect(() => {
        // Initialize the SDK
        const config: AttentiveSdkConfiguration = {
            attentiveDomain: "vs",
            mode: "debug",
            enableDebugger: true,
        }
        initialize(config)

        // Identify the user
        const identifiers: UserIdentifiers = {
            phone: "+15556667777",
            email: "demo@example.com",
            klaviyoId: "userKlaviyoId",
            shopifyId: "userShopifyId",
            clientUserId: "userClientUserId",
            customIdentifiers: { customIdKey: "customIdValue" },
        }
        identify(identifiers)
    }, [])

    const handleShowCreative = () => {
        triggerCreative()
        Alert.alert("Success", "Creative triggered")
    }

    const handleClearUser = () => {
        clearUser()
        Alert.alert("Success", "User cleared")
    }

    const handleProductView = () => {
        recordProductViewEvent({
            items: [
                {
                    productId: "debug-test-product",
                    productVariantId: "debug-test-variant",
                    price: "29.99",
                    currency: "USD",
                    name: "Debug Test Product",
                    productImage: "https://example.com/image.jpg",
                    quantity: 1,
                    category: "test-category",
                },
            ],
            deeplink: "attentive://product/debug-test",
        })
        Alert.alert("Success", "Product view event recorded")
    }

    const handleAddToCart = () => {
        recordAddToCartEvent({
            items: [
                {
                    productId: "debug-cart-product",
                    productVariantId: "debug-cart-variant",
                    price: "49.99",
                    currency: "USD",
                    name: "Debug Cart Product",
                    quantity: 2,
                },
            ],
            deeplink: "attentive://cart/debug-test",
        })
        Alert.alert("Success", "Add to cart event recorded")
    }

    const handlePurchase = () => {
        recordPurchaseEvent({
            items: [
                {
                    productId: "purchase-product",
                    productVariantId: "purchase-variant",
                    price: "99.99",
                    currency: "USD",
                    name: "Purchase Product",
                    quantity: 1,
                },
            ],
            orderId: "order-123456",
            cartId: "cart-789",
            cartCoupon: "SAVE10",
        })
        Alert.alert("Success", "Purchase event recorded")
    }

    const handleCustomEvent = () => {
        recordCustomEvent({
            type: "Custom Action",
            properties: {
                action: "button_click",
                category: "engagement",
            },
        })
        Alert.alert("Success", "Custom event recorded")
    }

    const handleShowDebugHelper = () => {
        invokeAttentiveDebugHelper()
    }

    const handleExportLogs = async () => {
        try {
            const logs = await exportDebugLogs()
            Alert.alert("Debug Logs", logs)
        } catch (error) {
            Alert.alert("Error", "Failed to export logs")
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>
                        Attentive SDK Example
                    </Text>
                    <Text style={styles.subtitle}>
                        Test all SDK features
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Creative Management</Text>
                    <Button
                        title="Show Creative"
                        onPress={handleShowCreative}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Event Tracking</Text>
                    <View style={styles.buttonGroup}>
                        <Button
                            title="Record Product View"
                            onPress={handleProductView}
                        />
                    </View>
                    <View style={styles.buttonGroup}>
                        <Button
                            title="Record Add to Cart"
                            onPress={handleAddToCart}
                        />
                    </View>
                    <View style={styles.buttonGroup}>
                        <Button
                            title="Record Purchase"
                            onPress={handlePurchase}
                        />
                    </View>
                    <View style={styles.buttonGroup}>
                        <Button
                            title="Record Custom Event"
                            onPress={handleCustomEvent}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>User Management</Text>
                    <Button title="Clear User" onPress={handleClearUser} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Debug Tools</Text>
                    <View style={styles.buttonGroup}>
                        <Button
                            title="Show Debug Helper"
                            onPress={handleShowDebugHelper}
                        />
                    </View>
                    <View style={styles.buttonGroup}>
                        <Button
                            title="Export Debug Logs"
                            onPress={handleExportLogs}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 30,
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
    },
    section: {
        backgroundColor: "white",
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    buttonGroup: {
        marginTop: 8,
    },
})

export default App
