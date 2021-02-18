<template>
  <div id="app">
    <h1>Scheduler</h1>
              <v-date-picker :attributes="attrs"
          :value="null"
          @dayclick="daySelect"
          @transition-start="newmonth"
          
          v-model="date"
          mode="dateTime"
          :disabled-dates="disabledDates"
          :from-date="date"
          is24hr
          ref="calendar"
          >
        </v-date-picker>
    <p v-if="activeDate && calendarMode=='reserve'">
        <a v-on:click="selectMonth(activeDate)">Active date {{activeDate.year}}-{{activeDate.month}}-{{activeDate.day}}</a>
    </p>
        <p v-if="reserved">You have reservation at<br />
            <md-button v-on:click="selectMonth(reserved)" class="md-primary">
            {{reservedDate}}
            </md-button>
        </p>

    <md-list v-if="calendarMode=='reserve'">
            <md-list-item
              is="ReserveItem"
              v-for="time in times"
              v-bind:key="time.id"
              v-bind:time="time"
              v-bind:reserved="reserved"
              v-on:send="sendReserveData(time.reservableId)"
              v-on:cancel="deleteReservation"
              >
              </md-list-item>
    </md-list>

  <p v-if="dateSelected">
        <md-button v-on:click="addReservations" v-if="calendarMode=='reservable'" class="md-raised md-primary">Add reservable</md-button>
      </p>
        <p v-if="calendarMode=='reservable' && dateSelected">
            Copy to:<br />
            <md-button class="md-primary" data-toggle="tooltip" title="Copy positions to all this days of the month." v-on:click="copyToDay">Day</md-button>
            <md-button class="md-primary" data-toggle="tooltip" title="Copy positions to all this weeks weekdays." v-on:click="copyToWeek">Week</md-button>
            <md-button class="md-primary" data-toggle="tooltip" title="Copy positions to full month weekdays."  v-on:click="copyToMonth">Month</md-button>
        </p>
        <md-table v-if="calendarMode=='reservable' && dateSelected">
        <md-table-row>
            <md-table-head>
                At:
            </md-table-head>
            <md-table-head>
                Positions
            </md-table-head>
            <md-table-head>
                Duration in minutes
            </md-table-head>
            <md-table-head>Remove</md-table-head>
        </md-table-row>
        <md-table-row
            is="ReservableItem"
            v-for="(time, index) in reservableTimes"
            v-bind:key="time.id"
            v-bind:time="time" 
            v-on:remove="removeReservableDates(index, time.dayId)"
            v-on:changetime="changeTime"
            v-on:changepos="changePos(time, index)"
            v-on:changedur="changeDur(time, index)"
            ref="res"
            >
          </md-table-row>
          </md-table>
          <md-progress-spinner v-if="saving">
            <span class="sr-only">Saving...</span>
          </md-progress-spinner>
        <p v-if="!saving">
        <md-button v-on:click="sendReservablesData('day')" v-if="calendarMode=='reservable' && dateSelected" class="md-raised md-primary">Save</md-button>
        </p>


  </div>
</template>
<script>

import ReserveItem from './components/ReserveItem.vue'
import ReservableItem from './components/ReservableItem.vue'
import axios from 'axios';

export default {
  name: 'App',
  components: {
    ReserveItem,
    ReservableItem
  },
  created() {
    const params = new URLSearchParams(window.location.search)
    for (const param of params) {
        if (param[0] == "cid") this.calendarCode = param[1];
        if (param[0] == "test") {
            this.username = param[1];
            this.password = "testword";
            this.login();
            this.fetchData();
        }
    }
    this.getCalendar();    
  },

  data() {
    return {
      date: new Date(),
      dateSelected: false,
      attrs: [],
      days: [{
              highlight: {
                  color: 'purple',
                  fillMode: 'solid',
              },
              dates: [] 
          },
          {
              dot: 'red',
              dates: []
          }],   // days for hilight
      times: [],
      reservableTimes: [],
      daytimes: [],
      removeReservables: [],
      monthpage: new Date(),
      d_id: 0,
      calendarMode: '',
      disabledDates: { month: [1, 12] },
      calendarCode: 'NCKAA8',
      calendarId: null,
      accessToken: '',
      username: '',
      password: '',
      durH: [],
      modelConfig: {
          type: 'string',
          mask: 'YYYY-MM-DD', // Uses 'iso' if missing
        },
      testing: '',
      dateCache: [],  // Cache for the months that has been fetched.
      actLogin: true,
      loggedIn: false,
      you: null,      // userid
      reserved: null, // reserved data when user has reservation
      reservedDate: null,
      activeDate: null, // Selected date
      config: {
          headers: {
              'access_token': this.accessToken
          }
      },
      loginConfig: {
          headers: {'authorization': 'basic '+btoa(this.username+":"+this.password)}
      },
      saving: false,
      APIHost: process.env.VUE_APP_APIHOST
    }
  },
  methods: {
    toggleActButton() {
      this.actLogin = !this.actLogin;
  },
  // Populate reservable positions from specific day that'll be listed on front.
  daySelect(day) {
      this.dateSelected = true;
      if (!this.date) this.dateSelected = false;
      if (this.calendarMode == 'reserve') {
          this.times = [];
          let foundtimes = this.daytimes[day.year+"-"+day.month+"-"+day.day];
          if (typeof foundtimes !== 'undefined') {
              for (let foundtime of foundtimes) {
                  this.times.push(foundtime);
              } 
          }
      }
      if (this.calendarMode == 'reservable') {
          this.reservableTimes = [];
          let foundtimes = this.daytimes[day.year+"-"+day.month+"-"+day.day];
          if (typeof foundtimes !== 'undefined') {
              for (let foundtime of foundtimes) {
                  this.reservableTimes.push(foundtime);
              } 
          }        
      }
      this.activeDate = {day: day.day, month: day.month, year: day.year};
  },
  // Move calendar to the desired month
  selectMonth(reserved) {
      const day = reserved.day;
      const month = reserved.month;
      const year = reserved.year;
      this.$refs.calendar.move({ month: month, year: year });
      this.daySelect({year: year, month: month, day: day});
  },
  setMark(date) {
      this.days[1].dates.push(date);
  },
  // New fetch will be made by each new month page
  newmonth() {
      const year = this.$refs.calendar.$refs.calendar.pages[0].year;
      const month = this.$refs.calendar.$refs.calendar.pages[0].month;
      this.monthpage = year+"-"+month;
      let i = 0;
      for (i = 0; i < this.dateCache.length; i++) {
          if (this.dateCache[i].year == year && this.dateCache[i].month == month) {
              break;
          }
      }
      if (i == this.dateCache.length) this.fetchData();
      
  },
  resetDates() {
    this.reserved = null;
    this.reservedDate = null;
    this.dateCache = [];
    this.days[0].dates = [];
    this.daytimes = [];
  },
  removeReservableDates(index, dayId) {
      this.reservableTimes.splice(index, 1);
      this.daytimes[dayId].splice(index, 1);
  },
  copyToDay() {
      const times = new Date(this.date);
      const year = times.getFullYear();
      const month = times.getMonth()+1;
      const theDay = times.getDate();      
      const theDayid = year+"-"+month+"-"+theDay;

      for (let day = theDay-7; day > 0; day-=7) {
          this.daySelect({year: year, month: month, day: day});
          this.copyReservations(year, month, day, theDayid);
      }
      let maxDay = new Date(year, month, 0);
      maxDay = maxDay.getDate();
      for (let day = theDay+7; day <= maxDay; day+=7) {
          this.daySelect({year: year, month: month, day: day});
          this.copyReservations(year, month, day, theDayid);
      }
  },
  copyToWeek() {
      const times = new Date(this.date);
      const year = times.getFullYear();
      const month = times.getMonth()+1;
      const theDay = times.getDate();
      let wDay = times.getDay();
      if (wDay < 6) {
          const theDayid = year+"-"+month+"-"+theDay;

          for (let day = theDay-1;; day--) {
              if (wDay < 2) break;
              this.daySelect({year: year, month: month, day: day});
              this.copyReservations(year, month, day, theDayid);
              wDay--;
          }

          wDay = times.getDay();  

          for (let day = theDay+1;; day++) {
              if (wDay > 4) break;
              this.daySelect({year: year, month: month, day: day});
              this.copyReservations(year, month, day, theDayid);
              wDay++;
          }
      }
  },
  copyToMonth() {
      const times = new Date(this.date);
      const year = times.getFullYear();
      const month = times.getMonth()+1;
      const theDay = times.getDate();
      const theDayid = year+"-"+month+"-"+theDay;
      let maxDay = new Date(year, month-1, 0);
      maxDay = maxDay.getDate();
      for (let d = 1; d <= maxDay; d++) {
          if (!this.isWeekend(new Date(year, month-1, d)) && d != theDay) {
              this.daySelect({year: year, month: month, day: d});
              this.copyReservations(year, month, d, theDayid);
          }
      }

  },
  copyReservations(year, month, day, theDayid) {
      let dayid = "";
      for (let t = 0; t < this.daytimes[theDayid].length; t++) {
              let hour = this.daytimes[theDayid][t].hour;
              let minute = this.daytimes[theDayid][t].minute;
              this.date = new Date(year, month-1, day, hour, minute);
              this.addReservations();
          }
  },
  isWeekend(date) {
      const d = date.getDay();
      if (d == 6 || d == 0) {
          return true;
      }
      return false;
  },
  addReservations() {
      const times = new Date(this.date);
//            this.setMark(this.date);
//            this.attrs[1].dates.push(date);
      const year = times.getFullYear();
      const month = times.getMonth()+1;
      const day = times.getDate();
      let hour = times.getHours();
      const minute = times.getMinutes();
      let entries = 1, duration = 60;
      let i = 0;
      // Prevent duplicate dates for hilight (as there'll be multiple positions on one date).
      for (i = 0; i < this.days[0].dates.length; i++) {
          if (this.days[0].dates[i] == times+"") break;
      }
      if (i == this.days[0].dates.length) {
          this.days[0].dates.push(this.date);
      }
      // ... also for dot-mark.
      for (i = 0; i < this.days[1].dates.length; i++) {
          if (this.days[1].dates[i] == times+"") break;
      }
      if (i == this.days[1].dates.length) {
          this.days[1].dates.push(this.date);
      }

      const dayid = year+"-"+month+"-"+day;

      if (typeof this.daytimes[dayid] === 'undefined') this.daytimes[dayid] = [];

      let l = this.daytimes[dayid].length-1;
      if (l>-1) {
          hour = parseInt(this.daytimes[dayid][ l ].hour)+1;
          entries = this.daytimes[dayid][ l ].entries;                
          duration = this.daytimes[dayid][ l ].durationInMinutes;                
      }
      const timeString = year+"/"+month+"/"+day+" "+(hour > 9 ? "" + hour: "0" + hour)+":"+(minute > 9 ? "" + minute: "0" + minute);
      
      /*
      this.daytimes[dayid][this.daytimes[dayid].length] = {
          id: this.daytimes[dayid][this.daytimes[dayid].length].length-1,
          timeString: timeString
      }*/

      let id;
      if (l == -1) {
          id = 0;
      } else {
          id = this.daytimes[dayid][ l ].id+1;
      }
      this.daytimes[dayid].push({
          id: id,
          dayId: dayid,
          hour: hour,
          minute: minute,
          time: (hour > 9 ? "" + hour: "0" + hour)+":"+(minute > 9 ? "" + minute: "0" + minute),
          entries: entries,
          durationInMinutes: duration,
          timeData: {
              year: year,
              month: month,
              day: day,
              hour: hour,
              minute: minute,
              entries: entries,
              durationInMinutes: duration
          },
          remove: false,
          isAdded: true,
          timeString: timeString
      });

      this.attrs = this.days;
      this.reservableTimes.push(this.daytimes[dayid][this.daytimes[dayid].length-1]);
  },
  changeTime(time, date) {

      date = date+''; // change date-object to a string
      [this.daytimes[time.dayId][time.id].hour, this.daytimes[time.dayId][time.id].minute] = date.split(' ')[4].split(':');
      const h = this.daytimes[time.dayId][time.id].hour;
      this.daytimes[time.dayId][time.id].hour = h > 10 ? h : h.slice(1, 2);
      const m = this.daytimes[time.dayId][time.id].minute;
      this.daytimes[time.dayId][time.id].minute = m > 10 ? m : m.slice(1, 2);
      this.daytimes[time.dayId][time.id].time = h+":"+m;
      if (typeof this.daytimes[time.dayId][time.id].timeData === 'undefined') {
          this.daytimes[time.dayId][time.id].changed.reservableId = time.reservableId;
          this.daytimes[time.dayId][time.id].changed.hour = this.daytimes[time.dayId][time.id].hour;
          this.daytimes[time.dayId][time.id].changed.minute = this.daytimes[time.dayId][time.id].minute;
      } else {
          this.daytimes[time.dayId][time.id].timeData.hour = this.daytimes[time.dayId][time.id].hour;
          this.daytimes[time.dayId][time.id].timeData.minute = this.daytimes[time.dayId][time.id].minute;
      }
      this.setMark(this.date);
  },
  changePos(time, index) {
      this.daytimes[time.dayId][time.id].entries = this.$refs.res[index].$refs.pos.value;

      if (typeof this.daytimes[time.dayId][time.id].timeData === 'undefined') {
          this.daytimes[time.dayId][time.id].changed.reservableId = time.reservableId;
          this.daytimes[time.dayId][time.id].changed.entries = this.daytimes[time.dayId][time.id].entries;
      } else {
          this.daytimes[time.dayId][time.id].timeData.entries = this.daytimes[time.dayId][time.id].entries; 
      }            
      this.setMark(this.date);
  },
  changeDur(time, index) {
      this.daytimes[time.dayId][time.id].durationInMinutes = this.$refs.res[index].$refs.durMin.value
      if (typeof this.daytimes[time.dayId][time.id].timeData === 'undefined') {
          this.daytimes[time.dayId][time.id].changed.reservableId = time.reservableId;
          this.daytimes[time.dayId][time.id].changed.durationInMinutes = this.daytimes[time.dayId][time.id].durationInMinutes;
      } else {
          this.daytimes[time.dayId][time.id].timeData.durationInMinutes = this.daytimes[time.dayId][time.id].durationInMinutes;
      }
      this.setMark(this.date);
  },
  async login() {
      this.loginConfig.headers.authorization = 'basic '+btoa(this.username+":"+this.password);
      
      await axios.post(this.APIHost+'/app/Login', '', this.loginConfig)
      .then(response => {
          this.config.headers.access_token = response.data.access_token;
          let jwt = response.data.access_token.split('.');

        // TODO: use cookie. (undone)
          document.cookie = "jwt="+jwt[0];
          document.cookie = "jwt="+jwt[1];
          document.cookie = "jwt="+jwt[2];
          
          this.loggedIn = true;
      }).catch(err => {
           alert(err);     
      })
      
  },
  async fetchData() {
      const times = new Date(this.monthpage);
      const year = times.getFullYear();
      const month = times.getMonth()+1;
      const monthData = { "year": year, "month": month };
      this.dateCache.push(monthData);
      await axios.get(this.APIHost+'/app/reservables-by-calendar/'+this.calendarCode, { params: monthData}, this.config)
      .then(response => {
          let days = [];
          let dayid = null;
          let id = 0;
          if (!this.calendarMode) this.setSuitableCalendarMode();
          for(let data of response.data) {

              this.days[0].dates.push(new Date(data.year, data.month-1, data.day));
              dayid = data.year+"-"+data.month+"-"+data.day;
              if (typeof this.daytimes[dayid] === 'undefined') { 
                  this.daytimes[dayid] = [];
                  id = 0;
              }

              const hour = (data.hour > 9 ? "" + data.hour: "0" + data.hour);
              const minute = (data.minute > 9 ? "" + data.minute: "0" + data.minute);

              this.daytimes[dayid].push({
                  id: this.daytimes[dayid].length,
                  dayId: dayid,
                  changed: {},
                  time: hour+":"+minute,
                  hour: data.hour,
                  minute: data.minute,
                  reservableId: data.reservableid,
                  remove: false,
                  reservations: data.reservations,
                  entries: data.maxentries,
                  durationInMinutes: data.durationinminutes,
                  isAdded: false,
                  timeString: data.year+"/"+data.month+"/"+data.day+" "+hour+":"+minute
              });
          }

          this.attrs = this.days;
          this.attrs.push({
              dot: 'red',
              dates: []
          });
          }).catch(err => {
               alert(err);     
          })

  },

  async setSuitableCalendarMode() {
      
      let calendaruser = null;
      let you = null;
      await axios.get(this.APIHost+'/app/calendar/'+this.calendarCode)
      .then(response => {
          calendaruser = response.data[0].userid;
      }).catch(err => {
          console.log(err);     
      });

      await axios.get(this.APIHost+'/app/user', this.config)
      .then(response => {
          this.you = response.data[0].id;
      }).catch(err => {
          console.log(err);     
      });
      if (calendaruser == this.you) {
          this.calendarMode = 'reservable';
          this.disabledDates = '';
      } else {
          this.calendarMode = 'reserve';
          this.disabledDates = { month: [1, 12] };
          this.checkReservations();                
      }
  },
  async checkReservations() {
      await axios.get(this.APIHost+'/app/reservations-by-calendar/'+this.calendarCode)
      .then(response => {
          for(let data of response.data.reservations) {
              if (this.you == data.userid) {
                this.setReservedData(data);
              }
          }
      }).catch(err => {
          alert(err);     
      });
  },
  setReservedData(data) {
    this.reserved = {
      id: data.reservationid,
      reservableId: data.reservableid,
      year: data.year,
      month: data.month,
      day: data.day,
      hour: data.hour,
      minute: data.minute,
      duration: data.durationinminutes
    }
    this.reservedDate = new Date(data.year, data.month-1, data.day, data.hour, data.minute);
  },
  async sendReservablesData(unit = 'day') {
    this.saving = true;
    let reservableData =  {calendarId: this.calendarId, dates: []};
    let reservablePatch = [];
    let removeThese = [];

        let countOld = -1;   // Count reservables that already loaded from the database so that appended NEW reservables has the right index.
    if (unit == 'day') {
        const day = this.reservableTimes[0].dayId;
        for (let time of this.daytimes[day]) {
            if (time.remove) removeThese.push(time.reservableId);
            if (typeof time.timeData !== 'undefined') {
                const c = reservableData.dates.length+countOld;
                const i = (c==-1)?0:c;

                reservableData.dates.push(time.timeData);
                reservableData.dates[
                    reservableData.dates.length-1
                ].durationInMinutes = this.$refs.res[i].$refs.durMin.value;
            } else {
                if (time.changed.hasOwnProperty('reservableId') && !time.remove) {
                    reservablePatch.push(time.changed);
                }
                countOld++;
            }
        }
    }

    if (removeThese.length) {
        await axios.delete(this.APIHost+'/app/reservables/'+this.calendarCode, {headers: this.config.headers, data: {reservableId: removeThese}})
        .then(response => {
            const day = this.reservableTimes[0].dayId;
            let i = 0;
            for (let reservable of this.daytimes[day]) {
                for (let remove of removeThese) {
                    if (reservable.reservableId == remove) this.daytimes[day].splice(i, 1);
                }
                i++;
            }
        }).catch(err => {
            alert(err);     
        });
      }
      
      if (reservableData.dates.length) {
          await axios.post(this.APIHost+'/app/reservable', reservableData, this.config)
          .then(response => {
              console.log(response);
          }).catch(err => {
            alert(err);     
        });
      }
      if (reservablePatch.length) {
          await axios.patch(this.APIHost+'/app/reservable', reservablePatch, this.config)
          .then(response => {
              console.log(response);
          }).catch(err => {
        alert(err);     
   });
      }
      
  //   remove 'unconfirmed activity' -mark
      const idx = this.days[1].dates.map(Number).indexOf(+this.date);
      this.days[1].dates.splice(idx, 1);
      this.attrs = this.days;
      this.saving = false;
  },
    async sendReserveData(reservableId) {
    await axios.post(this.APIHost+'/app/reserve', [{"code": this.calendarCode, "reservableId": reservableId}], this.config)
        .then(async(response) => {
            this.resetDates();
            await this.fetchData();
            await this.checkReservations();
            this.selectMonth(this.activeDate);
      }).catch(err => {
        alert(err);     
   });
  },
  async deleteReservation(reservationId) {
      await axios.delete(this.APIHost+'/app/reservation/'+reservationId, {headers: this.config.headers})
      .then(async(response) => {
          this.resetDates();
          await this.fetchData();
          await this.checkReservations();
          this.selectMonth(this.activeDate); 
      }).catch(err => {
        alert(err);     
   });
  },
  async newUser(reservableId) {
      await axios.post(this.APIHost+'/app/user', {"username": this.username, "password": this.password})
      .then(response => {
          console.log(response);
      }).catch(err => {
        alert(err);     
   });
  },
  async getCalendar() {
    await axios.get(this.APIHost+'/app/calendar/'+this.calendarCode)
    .then(response => {
        this.calendarId = response.data[0].calendarid;
    }).catch(err => {
        alert(err);     
   })
  }    
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

