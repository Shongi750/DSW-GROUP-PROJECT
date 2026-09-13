import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function HomeScreen({navigation}) {
    return(
        <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
            <Text>University Gym Mentorship</Text>
            <Button title="Find a Mentor" color="#f97316" onPress={() => navigation.navigate('Mentors')}/>
        </View>
    )
}