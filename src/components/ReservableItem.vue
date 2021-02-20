  <template>
      <md-table-row>
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
          <md-table-cell md-label="Time" md-sort-by="time">
                       
                  <v-date-picker v-model="date" mode="time" ref="at" is24hr v-on:input="$emit('changetime', time, date)">
                      <template v-slot="{ inputEvents }">
                      <md-field>
                        <md-input type="time" :value="time.time" v-on="inputEvents" v-if="!time.remove"></md-input>
                        <md-input type="time" :value="time.time" v-on="inputEvents" v-if="time.remove" disabled></md-input>
                      </md-field>
  
                      </template>
                    </v-date-picker>
        </md-table-cell>
              

        <md-table-cell>
            <md-field>
              <md-input maxlength="2" size="2" ref="pos" v-on:input="$emit('changepos')" :value="time.entries" v-if="!time.remove" type="number" min="1" max="99"></md-input>        
              <md-input maxlength="2" size="2" ref="pos" v-on:input="$emit('changepos')" :value="time.entries" v-if="time.remove" disabled></md-input>
            </md-field>        
        </md-table-cell>
        <md-table-cell>
            <md-field>
                <md-input ref="durMin" v-on:input="$emit('changedur')" :value="time.durationInMinutes" v-if="!time.remove" type="number"></md-input>
                <md-input ref="durMin" v-on:input="$emit('changedur')" :value="time.durationInMinutes" v-if="time.remove" disabled></md-input>
            </md-field>
        </md-table-cell>
        <md-table-cell>
        <md-checkbox v-if=!time.isAdded v-model="time.remove"></md-checkbox>
        <md-button class="md-icon-button md-accent" v-on:click="$emit('remove')" v-if=time.isAdded>
            <md-icon>highlight_off</md-icon>
        </md-button>
       </md-table-cell>
        
      </md-table-row>
</template>

<script>

export default {
    name: 'ReservableItem',
    props: ['time', 'reserved'],
    data: function () {
        return {
          id: 0,
          date: new Date(),
          durH: 1,
          durMin: 0,
          pos: 1,
          removeReservables: []
        }
    },
}


</script>