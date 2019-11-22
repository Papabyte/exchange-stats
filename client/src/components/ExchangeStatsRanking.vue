<template>
  <section class="section">
    <div class="container">
      <h3 class="title is-3 mb-2">{{$t('rankingTitle')}}</h3>
    </div>

    <div class="container">
      <div class="box">
        <edit-wallet-modal :propExchange="clicked_exchange" :isRemoving="isRemoving"/>
        <b-table
                :data="data"
                :paginated="isPaginated"
                :loading="loading"
                :per-page="perPage"
                :current-page.sync="currentPage"
                :pagination-simple="isPaginationSimple"
                :pagination-position="paginationPosition"
                :default-sort-direction="defaultSortDirection"
                :sort-icon="sortIcon"
                :sort-icon-size="sortIconSize"
                default-sort="total_btc_wallet"
                aria-next-label="Next page"
                aria-previous-label="Previous page"
                aria-page-label="Page"
                aria-current-label="Current page">

          <template slot-scope="props">
            <b-table-column field="name" label="name" sortable>
              <template slot="header">
                {{ columns[0].label }}
              </template>
              {{ props.row.name }}
            </b-table-column>

            <b-table-column field="reported_volume" label="reported_volume" sortable>
              <template slot="header">
                {{ columns[1].label }}
              </template>
              <BtcAmount :amount="props.row.reported_volume"/>
            </b-table-column>

            <b-table-column field="nb_withdrawal_addresses" label="nb_withdrawal_addresses" sortable>
              <template slot="header">
                {{ columns[2].label }}
              </template>
              {{ props.row.nb_withdrawal_addresses }}
            </b-table-column>

            <b-table-column field="nb_deposit_addresses" label="nb_deposit_addresses" sortable>
              <template slot="header">
                {{ columns[3].label }}
              </template>
              {{ props.row.nb_deposit_addresses }}
            </b-table-column>

            <b-table-column field="total_btc_wallet" label="total_btc_wallet" sortable>
              <template slot="header">
                {{ columns[4].label }}
              </template>
              <BtcAmount v-if="props.row.total_btc_wallet" :amount="props.row.total_btc_wallet"/>
            </b-table-column>

            <b-table-column field="last_day_deposits" label="last_day_deposits" sortable>
              <template slot="header">
                {{ columns[5].label }}
              </template>
              <BtcAmount v-if="props.row.last_day_deposits" :amount="props.row.last_day_deposits"/>
            </b-table-column>

            <b-table-column  field="trend" label="trend" sortable>
              <template slot="header">
                {{ columns[5].label }}
              </template>
              <router-link :to="{name: 'exchangesStats', params: { exchange: props.row.exchange_id } }">
                <exchange-trend v-if="props.row.trend" :data="props.row.trend"/>
              </router-link>
            </b-table-column>

            <b-table-column field="last_day_withdrawals" label="last_day_withdrawals" sortable>
              <template slot="header">
                {{ columns[6].label }}
              </template>
              <BtcAmount v-if="props.row.last_day_withdrawals" :amount="props.row.last_day_withdrawals"/>
            </b-table-column>

            <b-table-column field="action" label="action" sortable>
              <template slot="header">
                {{ columns[7].label }}
              </template>

              <b-button-group>
                <b-link v-if="props.row.total_btc_wallet || props.row.nb_withdrawal_addresses"
                        :to="'/explorer/'+ props.row.exchange_id">
                  <b-button type="is-info" outlined class="text-nowrap">
                    {{$t('rankingTableButtonExploreWallet')}}
                  </b-button>
                </b-link>
                <b-dropdown hoverable aria-role="list">
                  <button class="button is-info is-outlined" slot="trigger">
                    <span>{{ $t('rankingTableButtonEdit') }}</span>
                    <b-icon icon="menu-down"></b-icon>
                  </button>

                  <b-dropdown-item aria-role="listitem" v-on:click="isRemoving=false;clicked_exchange=props.row.exchange_id;$buefy.modal.open('editWallet');">
                    {{$t('rankingTableButtonAddWallet')}}
                  </b-dropdown-item>
                  <b-dropdown-item aria-role="listitem" v-if="props.row.total_btc_wallet || props.row.nb_withdrawal_addresses"
                                   v-on:click="isRemoving=true;clicked_exchange=props.row.exchange_id;$buefy.modal.open('editWallet');">
                    {{$t('rankingTableButtonRemoveWallet')}}
                  </b-dropdown-item>
                </b-dropdown>
              </b-button-group>

            </b-table-column>
          </template>
        </b-table>
      </div>
    </div>

  </section>

</template>

<script>
  import BtcAmount from './commons/BtcAmount.vue';
  import EditWalletModal from './commons/EditWalletModal.vue';
  import ExchangeTrend from './commons/ExchangeTrend.vue';

  export default {
    components: {
      BtcAmount,
      EditWalletModal,
      ExchangeTrend
    },
    data() {
      return {
        data: [],
        isRemoving: false,
        clicked_exchange: null,
        isPaginated: true,
        isPaginationSimple: false,
        paginationPosition: 'bottom',
        defaultSortDirection: 'desc',
        sortIcon: 'arrow-up',
        sortIconSize: 'is-small',
        currentPage: 1,
        perPage: 20,
        loading: false,
        columns: [
          {field: 'name', sortable: true, label: this.$t('rankingTableColName')},
          {field: 'reported_volume', sortable: true, label: this.$t('rankingTableColReportedVolume')},
          {field: 'last_month_volume', sortable: true, label: this.$t('rankingTableColMonthlyVolume')},
          {field: 'nb_addresses', sortable: true, label: this.$t('rankingTableColNbAddresses')},
          {field: 'total_btc_wallet', sortable: true, label: this.$t('rankingTableColTotalBtcWallet')},
          {field: 'last_day_deposits', sortable: true, label: this.$t('rankingTableColLastDayDeposits')},
          {field: 'last_day_withdrawals', sortable: true, label: this.$t('rankingTableColLastDayWithdrawals')},
          {field: 'trend', label:this.$t('rankingTableColTrend')},
          {field: 'action', label: this.$t('rankingTableColAction')}
        ],
      }
    },
    methods: {
      loadData() {
        this.loading = true;
        this.axios.get('/api/ranking').then((response) => {
          this.total = response.data.length;
          response.data.forEach(function(row){
            if(row.trend)
              row.trend = row.trend.split("@").map(function(value){return Number(value)});
          });
          this.data = response.data;
        });
        this.loading = false;
      },
      onPageChange(page) {
        this.page = page
        this.loadData()
      }
    },
    mounted() {
      this.loadData()
    }
  }
</script>

<style scoped>
  .mb-2 {
    margin-bottom: 2rem;
  }
  .btn-group {
    width: 100%;
    justify-content: space-between;
    display: flex;
  }
</style>
