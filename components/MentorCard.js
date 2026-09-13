import React from 'react';
import {View,Text,Button} from 'react-native';

export default function MentorCard({mentor,onPress}){
    return(
        <View style={{padding:15,marginVertical:10,backgroundColor:'#eee',borderRadius:8,borderWidth:1,borderColor:'#f97316'}}>
            <Text style={{fontSize:18,fontWeight:'bold'}}>{mentor.name}</Text>
            <Text style={{color:'gray'}}>Expertise: {mentor.expertise}</Text>
            <Text style={{color:'gray'}}>Availability: {mentor.availability}</Text>
            <Button title="Match" color="#f97316" onPress={onPress} />
        </View>
    )
}