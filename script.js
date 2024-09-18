// تعريف المتغيرات الأساسية
const botToken = '7147928118:AAHYrSRDn5lgQ_hCh1S6pAWoAB9Mtc0rJTc';
const chatId1 = '@segabaghdad'; // القناة الأولى
const chatId2 = '@crada_iraq'; // القناة الثانية
const currentDataVersion = '2.0'; // قم بتغيير الإصدار عند تحديث البيانات

let currentRestaurant = JSON.parse(localStorage.getItem('currentRestaurant')) || null;

// قائمة المطاعم للقناة الأولى
const restaurants = [
    'ازبريي شارع فلسطين',
    'كوددت',
    'المختار الااراكَيل',
    'عيادة الميار شارع فلسطين',
    'زهور فانيلا',
    'مينا روز شارع فلسطين',
    'تجهيزات الملكة',
    'test',
    'فايرفاير شارع فلسطين',
    'لحم بعجين الموصلي شارع فلسطين',
    'دونير زون',
    'المراعي شارع فلسطين',
    'بيت المندي اليمني شارع فلسطين',
    'ويست برغر القاهرة',
    'توتاروز شارع فلسطين',
    'اوكي بيتزا شارع فلسطين',
    'مطعم وكافيه روزا شارع فلسطين',
    'دايتي شارع فلسطين',
    'أسماك طبوش',
    'كَوست ڤيب',
    'لحوم السراي',
    'AFC القاهرة',
    'فلافل لبنان شارع فلسطين2',
    'مشويات ابووطن شارع فلسطين',
    'كصابة المرتضئ شارع فلسطين',
    'مشويات أسهيل شارع فلسطين',
    'عالم الحليب1 شارع فلسطين',
    'كيف روز شارع فلسطين',
    'تجربه'
    
];

// قائمة المطاعم للقناة الثانية
const restaurants2 = [
    'testc',
    'مشويات ابووطن كرادة',
    'فايرفاير الكرادة'
    // أضف المزيد من المطاعم هنا
];

// دمج المطاعم في قائمة واحدة وإزالة التكرار إن وجد
const allRestaurants = [...new Set([...restaurants, ...restaurants2])];

// ترتيب المطاعم أبجدياً
const sortedRestaurants = allRestaurants.sort((a, b) => a.localeCompare(b, 'ar'));

// دالة لتحميل بيانات المطعم
async function loadRestaurantData(restaurantName) {
    try {
        const fileType = restaurants.includes(restaurantName) ? 'restaurants' : 'restaurants2';
        const response = await fetch(`${fileType}/${restaurantName}/data.json`);
        if (!response.ok) throw new Error('حدث خطأ أثناء تحميل بيانات المطعم');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`خطأ في تحميل بيانات المطعم ${restaurantName}:`, error);
        throw error;
    }
}


// دالة للتحقق من الإصدار وتحديث بيانات localStorage إذا لزم الأمر
function checkAndUpdateLocalStorage() {
    const storedVersion = localStorage.getItem('dataVersion');
    
    if (storedVersion !== currentDataVersion) {
        // إذا كان الإصدار غير متطابق، قم بتحديث البيانات
        localStorage.clear(); // مسح البيانات القديمة
        localStorage.setItem('dataVersion', currentDataVersion); // تحديث الإصدار في localStorage
        currentRestaurant = null; // إعادة تعيين المطعم الحالي
        console.log('تم تحديث بيانات localStorage.');
    }
}

// استدعاء الدالة للتحقق وتحديث البيانات عند تحميل الصفحة
checkAndUpdateLocalStorage();

// دالة للتحقق من صحة الجلسة
async function validateSession() {
    if (!currentRestaurant) return { isValid: false };

    try {
        const data = await loadRestaurantData(currentRestaurant.name);

        // التحقق من حالة الإيقاف
        if (data.isSuspended) {
            if (data.forceLogout) {
                // طرد المستخدم وإظهار رسالة السبب
                logout();
                showErrorMessage(`تم إيقاف حسابك. السبب: ${data.suspensionReason}`);
                return { isValid: false, isSuspended: true };
            } else {
                // فقط إظهار رسالة السبب بدون طرد المستخدم
                showErrorMessage(`لا يمكنك إرسال الطلبات لأن حسابك موقوف. السبب: ${data.suspensionReason}`);
                return { isValid: true, isSuspended: true };
            }
        }

        // التحقق من تطابق البريد الإلكتروني وكلمة المرور
        if (data.credentials.email.toLowerCase() === currentRestaurant.restaurantDetails.credentials.email.toLowerCase() &&
            data.credentials.password === currentRestaurant.restaurantDetails.credentials.password) {
            return { isValid: true, isSuspended: false };
        } else {
            // تسجيل الخروج إذا كانت كلمة المرور غير صحيحة
            logout();
            showErrorMessage('تم تغيير كلمة المرور. يرجى تسجيل الدخول مجددًا.');
            return { isValid: false };
        }
    } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
        return { isValid: false };
    }
}


// تحديث دالة تسجيل الدخول لتخزين بيانات الاعتماد بشكل صحيح
async function login(email, password) {
    const emailLower = email.toLowerCase().trim();

    if (!emailLower || !password) {
        showErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
        return;
    }

    document.getElementById('loadingIndicator').style.display = 'block';

    for (const restaurantName of allRestaurants) {
        try {
            const data = await loadRestaurantData(restaurantName);
            if (data.credentials.email.toLowerCase() === emailLower && data.credentials.password === password) {
                // تحقق من حالة الإيقاف
                if (data.isSuspended) {
                    showErrorMessage(`تم إيقاف حساب هذا المطعم. السبب: ${data.suspensionReason}`);
                    document.getElementById('loadingIndicator').style.display = 'none';
                    return;
                }

                currentRestaurant = {
                    name: restaurantName,
                    areas: data.areas,
                    restaurantDetails: {
                        credentials: {
                            email: data.credentials.email,
                            password: data.credentials.password
                        },
                        ...data.restaurantDetails
                    }
                };

                localStorage.setItem('currentRestaurant', JSON.stringify(currentRestaurant));
                localStorage.setItem('dataVersion', currentDataVersion); // تحديث الإصدار في localStorage

                initializeOrderPage();
                updateServiceFeeTotal();
                showSuccessMessage('تم تسجيل الدخول بنجاح.');
                document.getElementById('loadingIndicator').style.display = 'none';
                return;
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
        }
    }

    document.getElementById('loadingIndicator').style.display = 'none';
    showErrorMessage('بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
}

// دالة لتهيئة صفحة الطلب بعد تسجيل الدخول
function initializeOrderPage() {
    document.getElementById('restaurantName').textContent = currentRestaurant.name;
    document.getElementById('restaurantName').style.display = 'block';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('orderContainer').style.display = 'block';

    const locationSelect = document.getElementById('location');
    locationSelect.innerHTML = '<option value="">اختر المنطقة</option>';
    currentRestaurant.areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.name;
        option.textContent = area.name;
        locationSelect.appendChild(option);
    });

    locationSelect.addEventListener('change', function() {
        const selectedArea = currentRestaurant.areas.find(area => area.name === this.value);
        document.getElementById('price').value = selectedArea ? selectedArea.price : '';
    });

    // تحديث رسوم الخدمة في صفحة الطلب بعد تسجيل الدخول
    document.getElementById('serviceFee').value = `${currentRestaurant.restaurantDetails.serviceFee} دينار`;
}


// دالة لحفظ الطلب في localStorage
function saveOrder(order) {
    const ordersKey = `${currentRestaurant.name}_orders`;
    const existingOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    existingOrders.push(order);
    localStorage.setItem(ordersKey, JSON.stringify(existingOrders));
    console.log('تم حفظ الطلب بنجاح في localStorage.');
}


// تعديل دالة إرسال الرسالة إلى Telegram لتحديد القناة
async function sendMessageToTelegram(order) {
    const date = new Date(order.date);
    const formattedDate = date.toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // الحصول على رابط موقع المطعم من restaurantDetails.location
    const restaurantLocation = currentRestaurant.restaurantDetails.location || 'غير متوفر';

    const message = `
*📦 طلب جديد من  ${currentRestaurant.name}*

*🔢 رقم الزبون:* \`${order.customerNumber}\`
*🌍 المنطقة:* ${order.location}
*💵 كلفة التوصيل:* ${order.price} دينار
*🍽️ سعر الطلب:* ${order.orderPrice} دينار
*📝 ملاحظة:* ${order.note || 'لا يوجد'}

*🔢 رقم الطلب:* ${order.orderDigits || 'غير متوفر'}

*📍 موقع المطعم:* ${restaurantLocation}

*📅 التاريخ:* ${formattedDate}  
*🕒 الوقت:* ${formattedTime}
`;

    // تحديد قناة الإرسال بناءً على المطعم
    const channelId = restaurants.includes(currentRestaurant.name) ? chatId1 : chatId2;

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: channelId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) throw new Error('فشل في إرسال الرسالة إلى Telegram');
        console.log('تم إرسال الرسالة إلى Telegram بنجاح.');
        showSuccessMessage('تم إرسال الطلب بنجاح وسيصل السائق خلال 10 دقائق أو أقل.');
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        showErrorMessage('حدث خطأ بسبب عدم اتصالك بالإنترنت أو غيرها. لم يتم إرسال الطلب. يرجى المحاولة مرة أخرى.');
    }
}



// دالة لمعالجة إرسال الطلب
async function handleOrderSubmission() {
    // التحقق من صحة الجلسة
    const sessionResult = await validateSession();
    if (!sessionResult.isValid) return; // إذا كان الحساب موقوفًا وتم طرد المستخدم، الخروج من الدالة

    // إذا كان الحساب موقوفًا ولكن بدون طرد المستخدم، فقط إظهار رسالة ومنع إرسال الطلب
    if (sessionResult.isSuspended) {
        showErrorMessage(` ${data.suspensionReason}`);
        return;
    }

    const submitButton = document.getElementById('submitOrder');
    submitButton.disabled = true;  // تعطيل الزر

    showLoadingIndicator();  // إظهار شاشة التحميل

    // جمع بيانات النموذج
    const customerNumber = document.getElementById('customerNumber').value.trim();
    const location = document.getElementById('location').value;
    const price = document.getElementById('price').value.trim();
    const orderPrice = document.getElementById('orderPrice').value.trim();
    const note = document.getElementById('note').value.trim();
    const orderDigits = document.getElementById('orderLastFourDigits').value.trim();

    const serviceFee = currentRestaurant.restaurantDetails.serviceFee || 0;

    if (!validateOrderForm(customerNumber, location, price, orderPrice, orderDigits)) {
        hideLoadingIndicator();  // إخفاء شاشة التحميل
        submitButton.disabled = false;  // إعادة تفعيل الزر
        return;
    }

    const order = {
        customerNumber,
        location,
        price,
        orderPrice,
        note,
        orderDigits,
        serviceFee,
        date: new Date(),
        restaurantDetails: currentRestaurant.restaurantDetails
    };

    // إرسال الطلب إلى Telegram وحفظه في localStorage
    await sendMessageToTelegram(order);
    saveOrder(order);

    updateServiceFeeTotal();  // تحديث مجموع رسوم الخدمة
    resetOrderForm();

    hideLoadingIndicator();  // إخفاء شاشة التحميل
    submitButton.disabled = false;  // إعادة تفعيل الزر
}

// دالة للتحقق من صحة نموذج الطلب
function validateOrderForm(customerNumber, location, price, orderPrice, orderDigits) {
    let isValid = true;

    // التحقق من أن الحقل ليس فارغًا فقط، بدون فحص الصيغة أو الطول
    if (!customerNumber) {
        showFieldError('customerNumberError', 'يرجى إدخال رقم الزبون.');
        isValid = false;
    } else {
        hideFieldError('customerNumberError');
    }

    if (!location) {
        showFieldError('locationError', 'يرجى اختيار المنطقة.');
        isValid = false;
    } else {
        hideFieldError('locationError');
    }

    if (!orderPrice || isNaN(orderPrice)) {
        showFieldError('orderPriceError', 'يرجى إدخال سعر طلب صحيح.');
        isValid = false;
    } else {
        hideFieldError('orderPriceError');
    }

    // التحقق من رقم الطلب إذا كان موجوداً، لكنه ليس إلزامياً
    if (orderDigits && (orderDigits.length < 1 || orderDigits.length > 24 || isNaN(orderDigits))) {
        showFieldError('orderLastFourDigitsError', 'يرجى إدخال رقم طلب صحيح من 2 إلى 24 أرقام.');
        isValid = false;
    } else {
        hideFieldError('orderLastFourDigitsError');
    }

    return isValid;
}

function updateServiceFeeTotal() {
    const ordersKey = `${currentRestaurant.name}_orders`;
    const existingOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];

    // حساب مجموع رسوم الخدمة بناءً على الطلبات المخزنة
    const totalServiceFee = existingOrders.reduce((sum, order) => sum + (order.serviceFee || 0), 0);

    // تحديث مجموع رسوم الخدمة في العنصر على الشاشة
    document.getElementById('serviceFeeTotal').textContent = `${totalServiceFee} دينار`;
}



// دوال لعرض وإخفاء رسائل الخطأ في الحقول
function showFieldError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function hideFieldError(elementId) {
    const element = document.getElementById(elementId);
    element.textContent = '';
    element.style.display = 'none';
}

// دالة لتنظيف نموذج الطلب بعد الإرسال
function resetOrderForm() {
    document.getElementById('customerNumber').value = '';
    document.getElementById('location').value = '';
    document.getElementById('price').value = '';
    document.getElementById('orderPrice').value = '';
    document.getElementById('note').value = '';
    document.getElementById('orderLastFourDigits').value = '';
} 

$(document).ready(function() {
    // إظهار رسالة الصيانة لمدة 5 ثوانٍ ثم إخفائها
    $('#maintenanceMessage').show();
    setTimeout(function() {
        $('#maintenanceMessage').fadeOut();
    }, 2000); // إخفاء الرسالة بعد 5 ثوانٍ
});

$(document).ready(function() {
    // إظهار رسالة الصيانة
    $('#maintenanceMessage').show();
    
    // تحديث مجموع رسوم الخدمة عند تحميل الصفحة
    if (currentRestaurant) {
        updateServiceFeeTotal();
    }
});



// دوال لعرض رسائل النجاح والخطأ
function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 6000);
}

function showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 6000);
}


function showLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'none';
}


// دالة لعرض سجل الطلبات
function displayOrders() {
    if (!currentRestaurant) {
        showErrorMessage('يرجى تسجيل الدخول أولاً لعرض سجل الطلبات.');
        return;
    }

    const ordersKey = `${currentRestaurant.name}_orders`;
    const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];

    if (orders.length === 0) {
        showErrorMessage('لا توجد طلبات مسجلة لهذا المطعم.');
        return;
    }

    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = ''; // تنظيف الجدول

    // عرض جميع الطلبات
    orders.reverse().forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.customerNumber}</td>
            <td>${order.location}</td>
            <td>${order.price} دينار</td>
            <td>${order.orderPrice} دينار</td>
            <td>${order.serviceFee} دينار</td> <!-- إضافة رسوم الخدمة -->
            <td>${order.note || '-'}</td>
            <td>${order.orderDigits}</td>
            <td>${new Date(order.date).toLocaleString('ar-IQ')}</td>
        `;
        ordersList.appendChild(row);
    });
    
    // حساب ملخص الطلبات
    calculateOrderSummary(orders);

    // عرض النافذة المنبثقة لسجل الطلبات
    document.getElementById('ordersModal').style.display = 'block';
    initializeDataTable();
}

// دالة لتفعيل DataTable على جدول الطلبات
function initializeDataTable() {
    $('#ordersTable').DataTable({
        retrieve: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.3/i18n/ar.json'
        },
        pageLength: 2, // عدد الطلبات الظاهرة في كل صفحة
        lengthMenu: [5, 10, 15, 20, 50, 100], // خيارات أعداد الطلبات للعرض
    });
}


// دالة لحساب ملخص الطلبات
function calculateOrderSummary(orders) {
    const totalOrders = orders.length;

    const today = new Date();
    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.toDateString() === today.toDateString();
    }).length;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weeklyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= weekStart;
    }).length;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= monthStart;
    }).length;

    // حساب مجموع رسوم الخدمة من الطلبات المخزنة
    const totalServiceFee = orders.reduce((sum, order) => sum + (order.serviceFee || 0), 0);

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('todayOrders').textContent = todayOrders;
    document.getElementById('weeklyOrders').textContent = weeklyOrders;
    document.getElementById('monthlyOrders').textContent = monthlyOrders;
    
    // تحديث مجموع رسوم الخدمة
    document.getElementById('serviceFeeTotal').textContent = `${totalServiceFee} دينار`;
}


// دالة لتفعيل DataTable على جدول الطلبات
function initializeDataTable() {
    $('#ordersTable').DataTable({
        retrieve: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.3/i18n/ar.json'
        },
        pageLength: 2, // عدد الطلبات الظاهرة في كل صفحة
        lengthMenu: [2, 5, 10, 15, 20], // خيارات أعداد الطلبات للعرض
    });
}

// دالة لتسجيل الخروج مع إظهار رسالة تأكيد مخصصة
function showLogoutConfirmation() {
    // إظهار نافذة التأكيد المخصصة
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'block';

    const confirmBtn = document.getElementById('confirmLogoutBtn');

    // تعليق أو إزالة تحريك الزر عشوائياً
    confirmBtn.onmouseover = null; // هذا سيمنع الزر من التحرك

    // عند النقر على زر "نعم" بعد محاولة الوصول إليه
    confirmBtn.onclick = function() {
        modal.style.display = 'none';
        logout(); // استدعاء دالة تسجيل الخروج
    };

    // عند النقر على زر "لا" لإلغاء تسجيل الخروج
    document.getElementById('cancelLogoutBtn').onclick = function() {
        modal.style.display = 'none';
    };
}

// دالة لتسجيل الخروج
function logout() {
    currentRestaurant = null;
    localStorage.removeItem('currentRestaurant');
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('orderContainer').style.display = 'none';
    showSuccessMessage('تم تسجيل الخروج بنجاح.');
}

// إعداد مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (currentRestaurant) {
        initializeOrderPage();
    }

    // مستمع زر تسجيل الدخول
    document.getElementById('loginBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        login(email, password);
    });

    // مستمع زر إرسال الطلب
    document.getElementById('submitOrder').addEventListener('click', function(e) {
        e.preventDefault();
        handleOrderSubmission();
    });

    // مستمع زر عرض سجل الطلبات
    document.getElementById('showOrders').addEventListener('click', function(e) {
        e.preventDefault();
        displayOrders();
    });

    // مستمع زر إغلاق نافذة السجل
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';
    });

    // مستمع زر تسجيل الخروج مع إظهار رسالة التأكيد المخصصة
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        showLogoutConfirmation();
    });
});
