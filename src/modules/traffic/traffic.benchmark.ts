/**
 * Synthetic delivery benchmark records representing typical East Java transit corridors.
 * Used as an in-memory fallback baseline when no external CSV is provided.
 */
export const DEFAULT_HISTORICAL_CSV = `Delivery ID,Warehouse,Day/Time,Actual Duration (minutes),Notes
DL99,W01,"Mon, 08:00",50,Morning urban peak
DL100,W01,"Mon, 14:00",15,-
DL101,W01,"Tue, 07:30",55,Morning urban peak
DL102,W01,"Wed, 16:30",48,Evening exit peak
DL103,W01,"Thu, 11:00",18,-
DL104,W01,"Fri, 17:00",65,Weekend outbound congestion
DL105,W01,"Sat, 10:00",12,-
DL106,W01,"Sun, 09:00",10,Off-peak Sunday morning
DL107,W02,"Mon, 08:00",70,Morning corridor congestion
DL108,W02,"Mon, 13:00",25,-
DL109,W02,"Wed, 07:45",65,Morning rush hour
DL110,W02,"Thu, 18:00",80,Heavy evening traffic
DL111,W02,"Fri, 17:30",100,Peak highway bottleneck
DL112,W02,"Sat, 11:00",22,-
DL113,W02,"Sun, 10:00",20,-
DL114,W03,"Mon, 09:00",45,-
DL115,W03,"Tue, 15:00",40,-
DL116,W03,"Thu, 07:00",60,Morning commuter influx
DL117,W03,"Fri, 16:00",75,Weekend departure queue
DL118,W03,"Sat, 13:00",35,-
DL119,W04,"Mon, 10:00",50,-
DL120,W04,"Wed, 08:00",70,Port corridor slowdown
DL121,W04,"Thu, 14:00",45,-
DL122,W04,"Fri, 17:00",85,Industrial area peak
DL123,W04,"Sun, 11:00",38,-
DL124,W05,"Tue, 09:00",130,-
DL125,W05,"Thu, 10:00",125,-
DL126,W05,"Fri, 14:00",165,Inter-city weekend corridor
DL127,W05,"Sat, 08:00",170,Weekend recreational traffic
DL128,W05,"Sun, 16:00",190,Sunday return highway queue
DL129,W06,"Mon, 11:00",135,-
DL130,W06,"Wed, 09:00",140,-
DL131,W06,"Fri, 15:00",180,Weekend regional influx
DL132,W06,"Sun, 17:00",200,Sunday return corridor
DL133,W07,"Tue, 10:00",65,-
DL134,W07,"Thu, 15:00",70,-
DL135,W08,"Mon, 09:00",210,Long-distance regional transit
DL136,W08,"Thu, 11:00",205,-`
