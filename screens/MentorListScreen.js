import React from 'react';
import {View,FlatList} from 'react-native';
import MentorCard from '../components/MentorCard';

const mentors = [
    {id:'1',name:'John Doe', expertise:'Fitness', availability:'Mon-Fri 9am-5pm'},
    {id:'2',name:'Jane Smith', expertise:'Nutrition', availability:'Mon-Fri 10am-4pm'},
    {id:'3',name:'Mike Johnson', expertise:'Strength Training', availability:'Mon-Fri 8am-6pm'},
];

export default function MentorListScreen({navigation}) {
    return(
        <View style={{flex:1,padding:10}}>
            <FlatList
                data={mentors}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                    <MentorCard mentor={item} onPress={() => navigation.navigate('Match', { mentor: item })} />
                )}
            />

        </View>
    )
}
