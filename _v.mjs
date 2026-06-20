import Attraction from './models/Attraction.js';
import Hotel from './models/Hotel.js';
const a = new Attraction({ name:'Test', district:'Nurota' });
const e = a.validateSync();
console.log('Attraction(no coords) valid:', !e, e?e.message:'');
const a2 = new Attraction({ name:'X', district:'Xatirchi', video360:{url:'u',type:'youtube'}, thingsToSeeAround:[{title:'t',type:'tarix',walkingMinutes:5}], location:{lat:40,lng:65}, geo:{type:'Point',coordinates:[65,40]}, accessibility:{wheelchairAccessible:true} });
console.log('Attraction(full) valid:', !a2.validateSync());
console.log('Attraction(bad district) rejected:', !!new Attraction({name:'Y',district:'Bad'}).validateSync());
console.log('Hotel(district) valid:', !new Hotel({name:'H',district:'Qiziltepa',location:{lat:40,lng:65}}).validateSync());
