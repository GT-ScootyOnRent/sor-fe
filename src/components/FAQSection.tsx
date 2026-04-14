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
        'You need a valid driving license, a government-issued ID proof (Aadhar card/PAN card), and a security deposit. All documents must be original.',
    },
    {
      question: 'What is the minimum rental period?',
      answer:
        'The minimum rental period is 4 hours. However, we offer flexible packages for daily, 3-day, and weekly rentals at discounted rates.',
    },
    {
      question: 'Is fuel included in the rental price?',
      answer:
        'No, fuel is not included. The vehicle will be provided with a full tank, and you are expected to return it with a full tank or pay for the consumed fuel.',
    },
    {
      question: 'What happens if I exceed the kilometer limit?',
      answer:
        'Each vehicle has a daily kilometer limit. If you exceed this limit, excess kilometer charges will apply as mentioned in the booking details.',
    },
    {
      question: 'What if the vehicle breaks down?',
      answer:
        'In case of any breakdown or issue, contact our 24/7 support immediately. We will provide roadside assistance or a replacement vehicle based on the situation.',
    },
    {
      question: 'Is helmet provided?',
      answer:
        'The helmet is charged ₹200 per unit.',
    },
    {
      question: 'Can I pick up and drop off at different locations?',
      answer:
        'Yes, we offer flexible pickup and drop-off locations across our service cities. Additional charges may apply for different location drop-offs.',
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
