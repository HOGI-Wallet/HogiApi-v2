import moment from 'moment';

/**
 *
 * @param from %Y-%m-%d date format
 * @param to  %Y-%m-%d date format
 */
export const dailyWalletGeneratedAgg = (from: string, to: string) => [
  {
    $group: {
      _id: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: {
            $toDate: '$createdAt',
          },
        },
      },
      count: {
        $sum: 1,
      },
    },
  },
  {
    $match: {
      _id: {
        $gte: moment(new Date(from)).utc().format('YYYY-MM-DD'),
        $lte: moment(new Date(to)).utc().format('YYYY-MM-DD'),
      },
    },
  },
];
