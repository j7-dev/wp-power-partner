import $ from 'jquery'

/**
 * 選擇不同網站時
 * 同步 value 給 linked_site input
 */

function linkedSite() {
  const select = $('#linked_site')
  const input = $("input[name='linked_site']")

  select.on('change', function (e) {
    e.stopPropagation()

    // choose the selected value

    const value = $(this).val() as string
    console.log('⭐  value:', value)
    input.val(value)
  })
}

export default linkedSite
