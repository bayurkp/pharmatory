/**
 * Synthetic delivery benchmark records representing typical East Java transit corridors.
 * Used as an in-memory fallback baseline when no external CSV is provided.
 */
export const DEFAULT_HISTORICAL_CSV = `Delivery ID,Warehouse,Day/Time,Actual Duration (minutes),Notes
DL01,W01,"Mon, 08:00",50,Morning urban peak
DL02,W01,"Mon, 14:00",15,-
DL03,W01,"Tue, 07:30",55,Morning urban peak
DL04,W01,"Wed, 16:30",48,Evening exit peak
DL05,W01,"Thu, 11:00",18,-
DL06,W01,"Fri, 17:00",65,Weekend outbound congestion
DL07,W01,"Sat, 10:00",12,-
DL08,W01,"Sun, 09:00",10,Off-peak Sunday morning
DL09,W02,"Mon, 08:00",70,Morning corridor congestion
DL10,W02,"Mon, 13:00",25,-
DL11,W02,"Wed, 07:45",65,Morning rush hour
DL12,W02,"Thu, 18:00",80,Heavy evening traffic
DL13,W02,"Fri, 17:30",100,Peak highway bottleneck
DL14,W02,"Sat, 11:00",22,-
DL15,W02,"Sun, 10:00",20,-
DL16,W03,"Mon, 09:00",45,-
DL17,W03,"Tue, 15:00",40,-
DL18,W03,"Thu, 07:00",60,Morning commuter influx
DL19,W03,"Fri, 16:00",75,Weekend departure queue
DL20,W03,"Sat, 13:00",35,-
DL21,W04,"Mon, 10:00",50,-
DL22,W04,"Wed, 08:00",70,Port corridor slowdown
DL23,W04,"Thu, 14:00",45,-
DL24,W04,"Fri, 17:00",85,Industrial area peak
DL25,W04,"Sun, 11:00",38,-
DL26,W05,"Tue, 09:00",130,-
DL27,W05,"Thu, 10:00",125,-
DL28,W05,"Fri, 14:00",165,Inter-city weekend corridor
DL29,W05,"Sat, 08:00",170,Weekend recreational traffic
DL30,W05,"Sun, 16:00",190,Sunday return highway queue
DL31,W06,"Mon, 11:00",135,-
DL32,W06,"Wed, 09:00",140,-
DL33,W06,"Fri, 15:00",180,Weekend regional influx
DL34,W06,"Sun, 17:00",200,Sunday return corridor
DL35,W07,"Tue, 10:00",65,-
DL36,W07,"Thu, 15:00",70,-
DL37,W08,"Mon, 09:00",210,Long-distance regional transit
DL38,W08,"Thu, 11:00",205,-`
