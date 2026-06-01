import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

export default function FAQSection() {
  const faqs = [
    {
      question: 'What documents do I need to rent a vehicle?',
      answer:
        'You need an original valid permanent two-wheeler driving license, an Aadhar card, and a security deposit. If your current address is different from your ID, address proof may also be required. The minimum age is 18 years.',
    },
    {
      question: 'Is fuel included in the rental price?',
      answer:
        'No, fuel is not included. The vehicle will be provided with enough fuel to reach the nearest fuel station, and it should be returned with enough fuel for the next customer to reach the nearest pump. If the fuel is insufficient at return, a charge of Rs. 50 will apply.',
    },
    {
      question: 'What happens if I exceed the kilometer limit?',
      answer:
        'Each vehicle has a daily kilometer limit. If you exceed this limit, excess kilometer charges will apply as mentioned in the booking details.',
    },
    {
      question: 'What if the vehicle breaks down?',
      answer:
        'If the vehicle breaks down, contact Scooty On Rent support immediately. Assistance will be provided based on the situation.',
    },
    {
      question: 'Is helmet provided?',
      answer:
        'One helmet is provided free with each booking. Additional helmets are available at ₹50 per helmet. A lost or damaged helmet will be charged at ₹1000.',
    },
    {
      question: 'Can I pick up and drop off at different locations?',
      answer:
        'Pickup and drop-off are subject to availability and Scooty On Rent policy. Please confirm the exact location at pickup time.',
    },
  ];

  return (
    <div className="bg-gray-50 py-16 px-4 rounded-lg">
      <h2 className="text-3xl text-black text-center mb-10">
        Frequently Asked Questions
      </h2>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white rounded-lg px-6 border border-gray-200"
            >
              <AccordionTrigger className="text-left hover:text-primary-500">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
