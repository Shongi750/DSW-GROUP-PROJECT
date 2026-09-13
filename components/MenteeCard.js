import React from 'react';
import {View,Text,Button} from 'react-native';

export default function MenteeCard({mentor,onPress}) {
    return(
        <View style={{
        padding:15,
        marginVertical:10,
        backgroundColor:'#eee',
        borderRadius:8,
        borderWidth:1,
        borderColor:'#ddd'}}>
            <Text style={{fontSize:18,fontWeight:'bold'}}>{mentor.name}</Text>
            <Text style={{color:'gray'}}>Fitness Level:{mentor.level}</Text>
            <Text style={{color:'gray'}}>Goals: {mentor.goals}</Text>
            <Text style={{color:'gray'}}>Preffered Mentor:{mentor.preference}</Text>
            <Button title="View Profile" onPress={onPress} />
        </View>
    )
}