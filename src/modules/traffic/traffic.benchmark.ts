/**
 * Synthetic delivery benchmark records representing typical East Java transit corridors.
 * Used as an in-memory fallback baseline when no external CSV is provided.
 */
export const DEFAULT_HISTORICAL_CSV = `Delivery ID,Warehouse,Day/Time,Actual Duration (minutes),Notes
LOG-101,W01,"Mon, 08:00",50,Morning urban peak
LOG-102,W01,"Mon, 14:00",15,-
LOG-103,W01,"Tue, 07:30",55,Morning urban peak
LOG-104,W01,"Wed, 16:30",48,Evening exit peak
LOG-105,W01,"Thu, 11:00",18,-
LOG-106,W01,"Fri, 17:00",65,Weekend outbound congestion
LOG-107,W01,"Sat, 10:00",12,-
LOG-108,W01,"Sun, 09:00",10,Off-peak Sunday morning
LOG-109,W02,"Mon, 08:00",70,Morning corridor congestion
LOG-110,W02,"Mon, 13:00",25,-
LOG-111,W02,"Wed, 07:45",65,Morning rush hour
LOG-112,W02,"Thu, 18:00",80,Heavy evening traffic
LOG-113,W02,"Fri, 17:30",100,Peak highway bottleneck
LOG-114,W02,"Sat, 11:00",22,-
LOG-115,W02,"Sun, 10:00",20,-
LOG-116,W03,"Mon, 09:00",45,-
LOG-117,W03,"Tue, 15:00",40,-
LOG-118,W03,"Thu, 07:00",60,Morning commuter influx
LOG-119,W03,"Fri, 16:00",75,Weekend departure queue
LOG-120,W03,"Sat, 13:00",35,-
LOG-121,W04,"Mon, 10:00",50,-
LOG-122,W04,"Wed, 08:00",70,Port corridor slowdown
LOG-123,W04,"Thu, 14:00",45,-
LOG-124,W04,"Fri, 17:00",85,Industrial area peak
LOG-125,W04,"Sun, 11:00",38,-
LOG-126,W05,"Tue, 09:00",130,-
LOG-127,W05,"Thu, 10:00",125,-
LOG-128,W05,"Fri, 14:00",165,Inter-city weekend corridor
LOG-129,W05,"Sat, 08:00",170,Weekend recreational traffic
LOG-130,W05,"Sun, 16:00",190,Sunday return highway queue
LOG-131,W06,"Mon, 11:00",135,-
LOG-132,W06,"Wed, 09:00",140,-
LOG-133,W06,"Fri, 15:00",180,Weekend regional influx
LOG-134,W06,"Sun, 17:00",200,Sunday return corridor
LOG-135,W07,"Tue, 10:00",65,-
LOG-136,W07,"Thu, 15:00",70,-
LOG-137,W08,"Mon, 09:00",210,Long-distance regional transit
LOG-138,W08,"Thu, 11:00",205,-`
