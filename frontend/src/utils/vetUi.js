const labels = {
  retry: ['Retry', 'पुन्हा प्रयत्न करा', 'फिर प्रयास करें'],
  loadError: ['Could not load this information. Please retry.', 'माहिती मिळाली नाही. पुन्हा प्रयत्न करा.', 'जानकारी नहीं मिली। फिर प्रयास करें।'],
  more: ['Load more', 'आणखी पहा', 'और देखें'],
  fee: ['Contact vet for fee', 'शुल्कासाठी डॉक्टरांना विचारा', 'शुल्क के लिए डॉक्टर से पूछें'],
  credentials: ['Verified credentials cannot be edited here. Contact support to request a correction.', 'पडताळलेली पात्रता येथे बदलता येत नाही. दुरुस्तीसाठी मदतीशी संपर्क करा.', 'सत्यापित जानकारी यहाँ नहीं बदली जा सकती। सुधार के लिए सहायता से संपर्क करें।'],
  previous: ['Previous page', 'मागील पान', 'पिछला पृष्ठ'],
  next: ['Next page', 'पुढील पान', 'अगला पृष्ठ'],
};
export const vetText = language => key => labels[key]?.[{ en: 0, mr: 1, hi: 2 }[String(language).split('-')[0]] ?? 0] || key;
