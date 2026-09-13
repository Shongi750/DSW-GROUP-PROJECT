import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

// getdata from database

const ShoppingListScreen = ({ route }) => {

  const {
    shoppingList,
    budget,
    retailer,
  } = route.params;

  //  

  const prices = {
    "Maize Meal": 45,
    "Rice": 38,
    "Eggs": 75,
    "Oats": 32,
    "Chicken": 90,
    "Banana": 25,
    "Milk": 30,
    "Beans": 25,
    "Lentils": 30,
    "Vegetables": 40,
    "Honey": 45,
    "Bread": 20,
    "Apple": 30,
  };

  const [selectedItems, setSelectedItems] = useState([]);

  const toggleItem = (item) => {

    if (selectedItems.includes(item)) {

      setSelectedItems(
        selectedItems.filter(
          (selected) => selected !== item
        )
      );

    } else {

      setSelectedItems([
        ...selectedItems,
        item,
      ]);

    }
  };

  const calculateCost = () => {

    return shoppingList.reduce(
      (total, item) => total + (prices[item] || 0),
      0
    );
  };

  const totalCost = calculateCost();

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Shopping List
      </Text>

      <Text style={styles.subtitle}>
        {retailer === "cheapest"
          ? "Best available prices"
          : retailer}
      </Text>

      <View style={styles.summary}>

        <Text style={styles.summaryText}>
          Your Budget
        </Text>

        <Text style={styles.budget}>
          R{budget}
        </Text>

        <Text style={styles.summaryText}>
          Estimated Cost
        </Text>

        <Text style={styles.cost}>
          R{totalCost}
        </Text>

        <Text style={styles.remaining}>
          Remaining: R{budget - totalCost}
        </Text>

      </View>

      <FlatList
        data={shoppingList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {

          const selected =
            selectedItems.includes(item);

          return (
            <TouchableOpacity
              style={styles.item}
              onPress={() => toggleItem(item)}
            >

              <View
                style={[
                  styles.checkbox,
                  selected && styles.checked,
                ]}
              >
                {selected && (
                  <Text>✓</Text>
                )}
              </View>

              <View>
                <Text
                  style={[
                    styles.itemName,
                    selected && styles.completed,
                  ]}
                >
                  {item}
                </Text>

                <Text style={styles.price}>
                  R{prices[item] || 0}
                </Text>
              </View>

            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => alert("Shopping list saved!")}
      >
        <Text style={styles.buttonText}>
          Save Shopping List
        </Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
    padding: 20,
  },

  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 20,
  },

  subtitle: {
    color: "#aaaaaa",
    marginBottom: 20,
  },

  summary: {
    backgroundColor: "#1c1c1c",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },

  summaryText: {
    color: "#aaaaaa",
  },

  budget: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  cost: {
    color: "#ffb38a",
    fontSize: 24,
    fontWeight: "bold",
  },

  remaining: {
    color: "#36d6c9",
    marginTop: 10,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#292929",
  },

  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 1,
    borderColor: "#555555",
    borderRadius: 5,
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  checked: {
    backgroundColor: "#ffb38a",
    borderColor: "#ffb38a",
  },

  itemName: {
    color: "white",
    fontSize: 17,
  },

  completed: {
    textDecorationLine: "line-through",
    color: "#777777",
  },

  price: {
    color: "#aaaaaa",
    marginTop: 3,
  },

  button: {
    backgroundColor: "#ffb38a",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },

  buttonText: {
    color: "#111111",
    fontWeight: "bold",
  },
});

export default ShoppingListScreen;