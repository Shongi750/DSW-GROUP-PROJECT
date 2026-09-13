import React from 'react';
import {View,Text} from 'react-native';

export default function MatchScreen({route}) {
    const { mentor } = route.params;
    return(
        <View>
            <Text style={{fontSize:22,marginBottom:10}}>Match Found!</Text>
             <Text style={{fontSize:18}}>You are matched with {mentor.name}</Text>
             <Text style={{color:'gray'}}>Expertise: {mentor.expertise}</Text>
             <Text style={{color:'gray'}}>Availability: {mentor.availability}</Text>

        </View>
    )
}